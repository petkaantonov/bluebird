"use strict";
module.exports = function( Promise ) {
    var ASSERT = require("./assert.js");
    var async = require( "./async.js" );
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;

    function Thenable() {
        this.errorObj = errorObj;
        this.__id__ = 0;
        this.treshold = 1000;
        this.thenableCache = new Array( this.treshold );
        this.promiseCache = new Array( this.treshold );
        this._compactQueued = false;
    }
    Thenable.prototype.couldBe = function Thenable$couldBe( ret ) {
        if( isPrimitive( ret ) ) {
            return false;
        }
        var id = ret.__id_$thenable__;
        if( typeof id === "number" &&
            this.thenableCache[id] !== void 0 ) {
            return true;
        }
        return ("then" in ret);
    };

    Thenable.prototype.is = function Thenable$is( ret, ref ) {
        var id = ret.__id_$thenable__;
        if( typeof id === "number" &&
            this.thenableCache[id] !== void 0 ) {
            ref.ref = this.thenableCache[id];
            ref.promise = this.promiseCache[id];
            return true;
        }
        return this._thenableSlowCase( ret, ref );
    };

    Thenable.prototype.addCache =
    function Thenable$_addCache( thenable, promise ) {
        var id = this.__id__;
        this.__id__ = id + 1;
        var descriptor = this._descriptor( id );
        Object.defineProperty( thenable, "__id_$thenable__", descriptor );
        this.thenableCache[id] = thenable;
        this.promiseCache[id] = promise;
        ASSERT( this.thenableCache[ thenable.__id_$thenable__ ] === thenable );
        if( this.thenableCache.length > this.treshold &&
            !this._compactQueued) {
            this._compactQueued = true;
            async.invokeLater( this._compactCache, this, void 0 );
        }
    };

    Thenable.prototype.deleteCache = function Thenable$deleteCache( thenable ) {
        var id = thenable.__id_$thenable__;
        ASSERT( typeof id === "number" );
        ASSERT( (id | 0) === id );
        if( id === -1 ) {
            return;
        }
        ASSERT( id > -1 );
        ASSERT( id < this.__id__ );
        ASSERT( this.thenableCache[id] === thenable );
        this.thenableCache[id] = void 0;
        this.promiseCache[id] = void 0;
        thenable.__id_$thenable__ = -1; //dont delete the property
    };

    var descriptor = {
        value: 0,
        enumerable: false,
        writable: true,
        configurable: true
    };
    Thenable.prototype._descriptor = function Thenable$_descriptor( id ) {
        descriptor.value = id;
        return descriptor;
    };

    Thenable.prototype._compactCache = function Thenable$_compactCache() {
        var arr = this.thenableCache;
        var promiseArr = this.promiseCache;
        var skips = 0;
        var j = 0;
        for( var i = 0, len = arr.length; i < len; ++i ) {
            var item = arr[ i ];
            if( item === void 0 ) {
                skips++;
            }
            else {
                promiseArr[ j ] = promiseArr[ i ];
                item.__id_$thenable__ = j;
                arr[ j++ ] = item;
            }
        }
        var newId = arr.length - skips;
        //Compacting didn't result in any new free space
        //so resize to 2x larger
        if( newId === this.__id__ ) {
            this.treshold *= 2;
        }
        else for( var i = newId, len = arr.length; i < len; ++i ) {
            promiseArr[ j ] = arr[ i ] = void 0;
        }

        this.__id__ = newId;
        this._compactQueued = false;
    };

    Thenable.prototype._thenableSlowCase =
    function Thenable$_thenableSlowCase( ret, ref ) {
        try {
            //Retrieving the property may throw
            var then = ret.then;
            if( typeof then === "function" ) {
                //Faking a reference so that the
                //caller may read the retrieved value
                //since reading .then again might
                //return something different
                ref.ref = then;
                return true;
            }
            return false;
        }
        catch(e) {
            this.errorObj.e = e;
            ref.ref = this.errorObj;
            //This idiosyncrasy is because of how the
            //caller code is currently layed out..
            return true;
        }
    };

    var thenable = new Thenable( errorObj );

    Promise._couldBeThenable = function( val ) {
        return thenable.couldBe( val );
    };

    function doThenable( obj, ref, caller ) {
        if( ref.promise != null ) {
            return ref.promise;
        }
        var resolver = Promise.pending( caller );
        var result = ref.ref;
        if( result === errorObj ) {
            resolver.reject( result.e );
            return resolver.promise;
        }
        thenable.addCache( obj, resolver.promise );
        var called = false;
        var ret = tryCatch2( result, obj, function t( a ) {
            if( called ) return;
            called = true;
            async.invoke( thenable.deleteCache, thenable, obj );
            var b = Promise$_Cast( a );
            if( b === a ) {
                resolver.fulfill( a );
            }
            else {
                if( a === obj ) {
                    ASSERT( resolver.promise.isPending() );
                    resolver.promise._resolveFulfill( a );
                }
                else {
                    b._then(
                        resolver.fulfill,
                        resolver.reject,
                        void 0,
                        resolver,
                        void 0,
                        t
                    );
                }
            }
        }, function t( a ) {
            if( called ) return;
            called = true;
            async.invoke( thenable.deleteCache, thenable, obj );
            resolver.reject( a );
        });
        if( ret === errorObj && !called ) {
            resolver.reject( ret.e );
            async.invoke( thenable.deleteCache, thenable, obj );
        }
        return resolver.promise;
    }

    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }
            var ref = { ref: null, promise: null };
            if( thenable.is( obj, ref ) ) {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return doThenable( obj, ref, caller );
            }
        }
        return obj;
    }

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable( x, ref ) {
        if( ref.promise != null ) {
            this._assumeStateOf( ref.promise, MUST_ASYNC );
            return;
        }
         //3.2 If retrieving the property x.then
        //results in a thrown exception e,
        //reject promise with e as the reason.
        if( ref.ref === errorObj ) {
            this._attachExtraTrace( ref.ref.e );
            async.invoke( this._reject, this, ref.ref.e );
        }
        else {
            thenable.addCache( x, this );
            //3.1. Let then be x.then
            var then = ref.ref;
            var localX = x;
            var localP = this;
            var key = {};
            var called = false;
            //3.3 If then is a function, call it with x as this,
            //first argument resolvePromise, and
            //second argument rejectPromise
            var t = function t( v ) {
                if( called && this !== key ) return;
                called = true;
                var fn = localP._fulfill;
                var b = Promise$_Cast( v );

                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    if( v === x ) {
                        //Thenable used itself as the value
                        async.invoke( fn, localP, v );
                        async.invoke( thenable.deleteCache, thenable, localX );
                    }
                    else {
                        b._then( t, r, void 0, key, void 0, t);
                    }
                    return;
                }


                if( b instanceof Promise ) {
                    var fn = b.isFulfilled()
                        ? localP._fulfill : localP._reject;
                    ASSERT( b.isResolved() );
                    v = v._resolvedValue;
                    b = Promise$_Cast( v );
                    ASSERT( b instanceof Promise || b === v );
                    if( b !== v ||
                        ( b instanceof Promise && b !== v ) ) {
                        b._then( t, r, void 0, key, void 0, t);
                        return;
                    }
                }
                async.invoke( fn, localP, v );
                async.invoke( thenable.deleteCache,
                        thenable, localX );
            };

            var r = function r( v ) {
                if( called && this !== key ) return;
                var fn = localP._reject;
                called = true;

                var b = Promise$_Cast( v );

                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    if( v === x ) {
                        //Thenable used itself as the reason
                        async.invoke( fn, localP, v );
                        async.invoke( thenable.deleteCache, thenable, localX );
                    }
                    else {
                        b._then( t, r, void 0, key, void 0, t);
                    }
                    return;
                }


                if( b instanceof Promise ) {
                    var fn = b.isFulfilled()
                        ? localP._fulfill : localP._reject;
                    ASSERT( b.isResolved() );
                    v = v._resolvedValue;
                    b = Promise$_Cast( v );
                    if( b !== v ||
                        ( b instanceof Promise && b.isPending() ) ) {
                        b._then( t, r, void 0, key, void 0, t);
                        return;
                    }
                }

                async.invoke( fn, localP, v );
                async.invoke( thenable.deleteCache,
                    thenable, localX );

            };
            var threw = tryCatch2( then, x, t, r);
            //3.3.4 If calling then throws an exception e,
            if( threw === errorObj &&
                !called ) {
                this._attachExtraTrace( threw.e );
                //3.3.4.2 Otherwise, reject promise with e as the reason.
                async.invoke( this._reject, this, threw.e );
                async.invoke( thenable.deleteCache, thenable, x );
            }
        }
    };

    Promise.prototype._tryThenable = function Promise$_tryThenable( x ) {
        var ref;
        if( !thenable.is( x, ref = {ref: null, promise: null} ) ) {
            return false;
        }
        this._resolveThenable( x, ref );
        return true;
    };

    Promise._cast = Promise$_Cast;
};