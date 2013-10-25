/**
 * Copyright (c) 2013 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
"use strict";
var global = require("./global.js");
var ASSERT = require("./assert.js");
var getPromise = require("./get_promise.js");
getPromise.set( Promise );
var util = require( "./util.js" );
var async = require( "./async.js" );
var errors = require( "./errors.js" );
var PromiseArray = require( "./promise_array.js" );
var SomePromiseArray = require( "./some_promise_array.js" );
var AnyPromiseArray = require( "./any_promise_array.js" );
var PropertiesPromiseArray = require( "./properties_promise_array.js" );
var SettledPromiseArray = require( "./settled_promise_array.js" );

var CapturedTrace = require( "./captured_trace.js");
var CatchFilter = require( "./catch_filter.js");
var PromiseInspection = require( "./promise_inspection.js" );
var PromiseResolver = require( "./promise_resolver.js" );
var PromiseSpawn = require( "./promise_spawn.js" );
var Thenable = require( "./thenable.js" );

var isArray = util.isArray;
var makeNodePromisified = util.makeNodePromisified;
var THIS = util.THIS;
var notEnumerableProp = util.notEnumerableProp;
var isPrimitive = util.isPrimitive;
var isObject = util.isObject;
var ensurePropertyExpansion = util.ensurePropertyExpansion;
var deprecated = util.deprecated;
var errorObj = util.errorObj;
var tryCatch1 = util.tryCatch1;
var tryCatch2 = util.tryCatch2;
var tryCatchApply = util.tryCatchApply;

var TypeError = errors.TypeError;
var CancellationError = errors.CancellationError;
var TimeoutError = errors.TimeoutError;
var ensureNotHandled = errors.ensureNotHandled;
var withHandledMarked = errors.withHandledMarked;
var withStackAttached = errors.withStackAttached;
var isStackAttached = errors.isStackAttached;
var isHandled = errors.isHandled;
var canAttach = errors.canAttach;

var APPLY = {};
var thenable = new Thenable( errorObj );

function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

function Promise( resolver ) {
    this._bitField = 67108864;
    this._fulfill0 = void 0;
    this._reject0 = void 0;
    this._progress0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    this._resolvedValue = void 0;
    this._cancellationParent = void 0;
    this._boundTo = void 0;
    if( longStackTraces ) this._traceParent = this._peekContext();
    if( typeof resolver === "function" ) this._resolveResolver( resolver );

}

Promise.prototype.bind = function Promise$bind( obj ) {
    var ret = new Promise();
    ret._setTrace( this.bind, this );
    ret._assumeStateOf( this, true );
    ret._setBoundTo( obj );
    return ret;
};

Promise.prototype.toString = function Promise$toString() {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] =
function Promise$catch( fn ) {
    var len = arguments.length;
    if( len > 1 ) {
        var catchInstances = new Array( len - 1 ),
            j = 0, i;
        for( i = 0; i < len - 1; ++i ) {
            var item = arguments[i];
            if( typeof item === "function" &&
                ( item.prototype instanceof Error ||
                item === Error ) ) {
                catchInstances[j++] = item;
            }
            else {
                var catchFilterTypeError =
                    new TypeError(
                        "A catch filter must be an error constructor");

                this._attachExtraTrace( catchFilterTypeError );
                this._reject(catchFilterTypeError);
                return;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter( catchInstances, fn, this._boundTo );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
};

Promise.prototype.progressed = function Promise$progressed( fn ) {
    return this._then( void 0, void 0, fn, void 0, void 0, this.progressed );
};


function thrower( r ) {
    throw r;
}
function slowFinally( ret, reasonOrValue ) {
    if( this.isFulfilled() ) {
        return ret._then(function() {
            return reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
    else {
        return ret._then(function() {
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
}
Promise.prototype.lastly = Promise.prototype["finally"] =
function Promise$finally( fn ) {
    var r = function( reasonOrValue ) {
        var ret = this._isBound() ? fn.call( this._boundTo ) : fn();
        if( isPromise( ret ) ) {
            return slowFinally.call( this, ret, reasonOrValue );
        }

        if( this.isRejected() ) {
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }
        return reasonOrValue;
    };
    return this._then( r, r, void 0, this, void 0, this.lastly );
};

Promise.prototype.inspect = function Promise$inspect() {
    return new PromiseInspection( this );
};

Promise.prototype.cancel = function Promise$cancel() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    while( cancelTarget._cancellationParent !== void 0 ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    if( cancelTarget === this ) {
        var err = new CancellationError();
        this._attachExtraTrace( err );
        this._reject( err );
    }
    else {
        cancelTarget.cancel((void 0));
    }
    return this;
};

Promise.prototype.uncancellable = function Promise$uncancellable() {
    var ret = new Promise();
    ret._setTrace( this.uncancellable, this );
    ret._unsetCancellable();
    ret._assumeStateOf( this, true );
    ret._boundTo = this._boundTo;
    return ret;
};

Promise.prototype.fork =
function Promise$fork( didFulfill, didReject, didProgress ) {
    var ret = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.fork );
    ret._cancellationParent = void 0;
    return ret;
};

Promise.prototype.call = function Promise$call( propertyName ) {
    var len = arguments.length;

    var args = new Array(len-1);
    for( var i = 1; i < len; ++i ) {
        args[ i - 1 ] = arguments[ i ];
    }

    return this._then( function( obj ) {
            return obj[ propertyName ].apply( obj, args );
        },
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

function Promise$getter( obj ) {
    var prop = typeof this === "string"
        ? this
        : ("" + this);
    return obj[ prop ];
}
Promise.prototype.get = function Promise$get( propertyName ) {
    return this._then(
        Promise$getter,
        void 0,
        void 0,
        propertyName,
        void 0,
        this.get
    );
};

Promise.prototype.then =
function Promise$then( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.then );
};

Promise.prototype.done =
function Promise$done( didFulfill, didReject, didProgress ) {
    var promise = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.done );
    promise._setIsFinal();
};

Promise.prototype.spread = function Promise$spread( didFulfill, didReject ) {
    return this._then( didFulfill, didReject, void 0,
        APPLY, void 0, this.spread );
};
Promise.prototype.isFulfilled = function Promise$isFulfilled() {
    return ( this._bitField & 268435456 ) > 0;
};

Promise.prototype.isRejected = function Promise$isRejected() {
    return ( this._bitField & 134217728 ) > 0;
};

Promise.prototype.isPending = function Promise$isPending() {
    return !this.isResolved();
};

Promise.prototype.isResolved = function Promise$isResolved() {
    return ( this._bitField & 402653184 ) > 0;
};

Promise.prototype.isCancellable = function Promise$isCancellable() {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function Promise$toJSON() {
    var inspection = this.inspect();
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: void 0,
        rejectionReason: void 0
    };
    if( inspection.isFulfilled() ) {
        ret.fulfillmentValue = inspection.value();
        ret.isFulfilled = true;
    }
    else if( inspection.isRejected() ) {
        ret.rejectionReason = inspection.error();
        ret.isRejected = true;
    }
    return ret;
};

function Promise$_successAdapter( val, receiver ) {
    var nodeback = this;
    var ret = tryCatch2( nodeback, receiver, null, val );
    if( ret === errorObj ) {
        async.invokeLater( thrower, void 0, ret.e );
    }
}
function Promise$_errorAdapter( reason, receiver ) {
    var nodeback = this;
    var ret = tryCatch1( nodeback, receiver, reason );
    if( ret === errorObj ) {
        async.invokeLater( thrower, void 0, ret.e );
    }
}

Promise.prototype.nodeify = function Promise$nodeify( nodeback ) {
    if( typeof nodeback == "function" ) {
        this._then(
            Promise$_successAdapter,
            Promise$_errorAdapter,
            void 0,
            nodeback,
            this._isBound() ? this._boundTo : null,
            this.nodeify
        );
    }
    return this;
};

function apiRejection( msg ) {
    var error = new TypeError( msg );
    var ret = Promise.rejected( error );
    var parent = ret._peekContext();
    if( parent != null ) {
        parent._attachExtraTrace( error );
    }
    return ret;
}

Promise.prototype.map = function Promise$map( fn ) {
    return Promise$_Map( this, fn, true, this.map );
};


Promise.prototype.filter = function Promise$filter( fn ) {
    return Promise$_Filter( this, fn, true, this.filter );
};

Promise.prototype.all = function Promise$all() {
    return Promise$_all( this, true, this.all );
};

Promise.prototype.any = function Promise$any() {
    return Promise$_Any( this, true, this.any );
};

Promise.prototype.settle = function Promise$settle() {
    return Promise$_Settle( this, true, this.settle );
};

Promise.prototype.some = function Promise$some( count ) {
    return Promise$_Some( this, count, true, this.some );
};

Promise.prototype.reduce = function Promise$reduce( fn, initialValue ) {
    return Promise$_Reduce( this, fn, initialValue, true, this.reduce );
};

 Promise.prototype.props = function Promise$props() {
    return Promise$_Props( this, true, this.props );
 };

Promise.is = isPromise;

function Promise$_Settle( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        SettledPromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    ).promise();
}
Promise.settle = function Promise$Settle( promises ) {
    return Promise$_Settle( promises, false, Promise.settle );
};

function Promise$_all( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    ).promise();
}
Promise.all = function Promise$All( promises ) {
    return Promise$_all( promises, false, Promise.all );
};

function Promise$_Props( promises, useBound, caller ) {
    var ret;
    if( isPrimitive( promises ) ) {
        ret = Promise.fulfilled( promises, caller );
    }
    else if( isPromise( promises ) ) {
        ret = promises._then( Promise.props, void 0, void 0,
                        void 0, void 0, caller );
    }
    else {
        ret = new PropertiesPromiseArray(
            promises,
            caller,
            useBound === true ? promises._boundTo : void 0
        ).promise();
        useBound = false;
    }
    if( useBound === true ) {
        ret._boundTo = promises._boundTo;
    }
    return ret;
}

Promise.props = function Promise$Props( promises ) {
    return Promise$_Props( promises, false, Promise.props );
};

Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise$_All( ret, PromiseArray, Promise.join, void 0 ).promise();
};

function Promise$_Any( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        AnyPromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    ).promise();
}
Promise.any = function Promise$Any( promises ) {
    return Promise$_Any( promises, false, Promise.any );
};

function Promise$_Some( promises, howMany, useBound, caller ) {
    if( ( howMany | 0 ) !== howMany ) {
        return apiRejection("howMany must be an integer");
    }
    var ret = Promise$_All(
        promises,
        SomePromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    );
    ret.setHowMany( howMany );
    return ret.promise();
}
Promise.some = function Promise$Some( promises, howMany ) {
    return Promise$_Some( promises, howMany, false, Promise.some );
};


function Promise$_mapper( fulfilleds ) {
    var fn = this;
    var receiver = void 0;

    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    var shouldDefer = false;

    if( receiver === void 0 ) {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            var fulfill = fn( fulfilleds[ i ], i, len );
            if( !shouldDefer && isPromise( fulfill ) ) {
                if( fulfill.isFulfilled() ) {
                    fulfilleds[i] = fulfill._resolvedValue;
                    continue;
                }
                else {
                    shouldDefer = true;
                }
            }
            fulfilleds[i] = fulfill;
        }
    }
    else {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            var fulfill = fn.call( receiver, fulfilleds[ i ], i, len );
            if( !shouldDefer && isPromise( fulfill ) ) {
                if( fulfill.isFulfilled() ) {
                    fulfilleds[i] = fulfill._resolvedValue;
                    continue;
                }
                else {
                    shouldDefer = true;
                }
            }
            fulfilleds[i] = fulfill;
        }
    }
    return shouldDefer
        ? Promise$_All( fulfilleds, PromiseArray,
            Promise$_mapper, void 0 ).promise()
        : fulfilleds;
}

function Promise$_Map( promises, fn, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === true ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    ).promise()
    ._then(
        Promise$_mapper,
        void 0,
        void 0,
        fn,
        void 0,
        caller
    );


}
Promise.map = function Promise$Map( promises, fn ) {
    return Promise$_Map( promises, fn, false, Promise.map );
};

function Promise$_reducer( fulfilleds, initialValue ) {
    var fn = this;
    var receiver = void 0;
    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    var len = fulfilleds.length;
    var accum = void 0;
    var startIndex = 0;

    if( initialValue !== void 0 ) {
        accum = initialValue;
        startIndex = 0;
    }
    else {
        startIndex = 1;
        if( len > 0 ) {
            for( var i = 0; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fulfilleds[i];
                startIndex = i + 1;
                break;
            }
        }
    }
    if( receiver === void 0 ) {
        for( var i = startIndex; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            accum = fn( accum, fulfilleds[i], i, len );
        }
    }
    else {
        for( var i = startIndex; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            accum = fn.call( receiver, accum, fulfilleds[i], i, len );
        }
    }
    return accum;
}

function Promise$_unpackReducer( fulfilleds ) {
    var fn = this.fn;
    var initialValue = this.initialValue;
    return Promise$_reducer.call( fn, fulfilleds, initialValue );
}

function Promise$_slowReduce( promises, fn, initialValue, useBound, caller ) {
    return initialValue._then( function callee( initialValue ) {
        return Promise$_Reduce( promises, fn, initialValue, useBound, callee );
    }, void 0, void 0, void 0, void 0, caller);
}

function Promise$_Reduce( promises, fn, initialValue, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === true ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    if( initialValue !== void 0 ) {
        if( isPromise( initialValue ) ) {
            if( initialValue.isFulfilled() ) {
                initialValue = initialValue._resolvedValue;
            }
            else {
                return Promise$_slowReduce( promises,
                    fn, initialValue, useBound, caller );
            }
        }

        return Promise$_All( promises, PromiseArray, caller,
            useBound === true ? promises._boundTo : void 0 )
            .promise()
            ._then( Promise$_unpackReducer, void 0, void 0, {
                fn: fn,
                initialValue: initialValue
            }, void 0, Promise.reduce );
    }
    return Promise$_All( promises, PromiseArray, caller,
            useBound === true ? promises._boundTo : void 0 ).promise()
        ._then( Promise$_reducer, void 0, void 0, fn, void 0, caller );
}

Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
    return Promise$_Reduce( promises, fn,
        initialValue, false, Promise.reduce);
};

function Promise$_filterer( fulfilleds ) {
    var fn = this;
    var receiver = void 0;
    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    var ret = new Array( fulfilleds.length );
    var j = 0;
    if( receiver === void 0 ) {
         for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            var item = fulfilleds[i];
            if( item === void 0 &&
                !( i in fulfilleds ) ) {
                continue;
            }
            if( fn( item, i, len ) ) {
                ret[j++] = item;
            }
        }
    }
    else {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            var item = fulfilleds[i];
            if( item === void 0 &&
                !( i in fulfilleds ) ) {
                continue;
            }
            if( fn.call( receiver, item, i, len ) ) {
                ret[j++] = item;
            }
        }
    }
    ret.length = j;
    return ret;
}

function Promise$_Filter( promises, fn, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === true ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    return Promise$_All( promises, PromiseArray, caller,
            useBound === true ? promises._boundTo : void 0 )
        .promise()
        ._then( Promise$_filterer, void 0, void 0, fn, void 0, caller );
}

Promise.filter = function Promise$Filter( promises, fn ) {
    return Promise$_Filter( promises, fn, false, Promise.filter );
};

Promise.fulfilled = function Promise$Fulfilled( value, caller ) {
    var ret = new Promise();
    ret._setTrace( typeof caller === "function"
        ? caller
        : Promise.fulfilled, void 0 );
    if( ret._tryAssumeStateOf( value, false ) ) {
        return ret;
    }
    ret._cleanValues();
    ret._setFulfilled();
    ret._resolvedValue = value;
    return ret;
};

Promise.rejected = function Promise$Rejected( reason ) {
    var ret = new Promise();
    ret._setTrace( Promise.rejected, void 0 );
    ret._cleanValues();
    ret._setRejected();
    ret._resolvedValue = reason;
    return ret;
};

Promise["try"] = Promise.attempt = function Promise$Try( fn, args, ctx ) {
    var ret = new Promise();
    ret._setTrace( Promise.attempt, void 0 );
    ret._cleanValues();
    if( typeof fn !== "function" ) {
        ret._setRejected();
        ret._resolvedValue = new TypeError("fn must be a function");
        return ret;
    }
    var value = isArray( args )
        ? tryCatchApply( fn, args, ctx )
        : tryCatch1( fn, ctx, args );

    if( value === errorObj ) {
        ret._setRejected();
        ret._resolvedValue = value.e;
    }
    else {
        ret._setFulfilled();
        ret._resolvedValue = value;
    }
    return ret;
};

Promise.pending = function Promise$Pending( caller ) {
    var promise = new Promise();
    promise._setTrace( typeof caller === "function"
                              ? caller : Promise.pending, void 0 );
    return new PromiseResolver( promise );
};

Promise.bind = function Promise$Bind( obj ) {
    var ret = new Promise();
    ret._setTrace( Promise.bind, void 0 );
    ret._setFulfilled();
    ret._setBoundTo( obj );
    return ret;
};


Promise._cast = cast;
Promise.cast = function Promise$Cast( obj, caller ) {
    var ret = cast( obj, caller );
    if( !( ret instanceof Promise ) ) {
        return Promise.fulfilled( ret, caller );
    }
    return ret;
};

Promise.onPossiblyUnhandledRejection =
function Promise$OnPossiblyUnhandledRejection( fn ) {
    if( typeof fn === "function" ) {
        CapturedTrace.possiblyUnhandledRejection = fn;
    }
    else {
        CapturedTrace.possiblyUnhandledRejection = void 0;
    }
};

Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
     if( typeof generatorFunction !== "function" ) {
        throw new TypeError( "generatorFunction must be a function" );
    }
    var PromiseSpawn$ = PromiseSpawn;
    return function anonymous() {
        var generator = generatorFunction.apply( this, arguments );
        var spawn = new PromiseSpawn$( void 0, void 0, anonymous );
        spawn._generator = generator;
        spawn._next( void 0 );
        return spawn.promise();
    };
};

Promise.spawn = function Promise$Spawn( generatorFunction ) {
    if( typeof generatorFunction !== "function" ) {
        return apiRejection( "generatorFunction must be a function" );
    }
    var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
    var ret = spawn.promise();
    spawn._run( Promise.spawn );
    return ret;
};

var longStackTraces = false || !!(
    typeof process !== "undefined" &&
    typeof process.execPath === "string" &&
    typeof process.env === "object" &&
    process.env[ "BLUEBIRD_DEBUG" ]
);

Promise.longStackTraces = function Promise$LongStackTraces() {
    if( async.haveItemsQueued() &&
        longStackTraces === false
    ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

Promise.hasLongStackTraces = function Promise$HasLongStackTraces() {
    return longStackTraces;
};

function f(){}
function isPromisified( fn ) {
    return fn.__isPromisified__ === true;
}
var hasProp = {}.hasOwnProperty;
var roriginal = new RegExp( "__beforePromisified__" + "$" );
function _promisify( callback, receiver, isAll ) {
    if( isAll ) {
        var changed = 0;
        var o = {};
        for( var key in callback ) {
            if( !roriginal.test( key ) &&
                !hasProp.call( callback,
                    ( key + "__beforePromisified__" ) ) &&
                typeof callback[ key ] === "function" ) {
                var fn = callback[key];
                if( !isPromisified( fn ) ) {
                    changed++;
                    var originalKey = key + "__beforePromisified__";
                    var promisifiedKey = key + "Async";
                    notEnumerableProp( callback, originalKey, fn );
                    o[ promisifiedKey ] =
                        makeNodePromisified( originalKey, THIS, key );
                }
            }
        }
        if( changed > 0 ) {
            for( var key in o ) {
                if( hasProp.call( o, key ) ) {
                    callback[key] = o[key];
                }
            }
            f.prototype = callback;
        }

        return callback;
    }
    else {
        return makeNodePromisified( callback, receiver, void 0 );
    }
}
Promise.promisify = function Promise$Promisify( callback, receiver ) {
    if( typeof callback === "object" && callback !== null ) {
        deprecated( "Promise.promisify for promisifying entire objects " +
            "is deprecated. Use Promise.promisifyAll instead." );
        return _promisify( callback, receiver, true );
    }
    if( typeof callback !== "function" ) {
        throw new TypeError( "callback must be a function" );
    }
    if( isPromisified( callback ) ) {
        return callback;
    }
    return _promisify(
        callback,
        arguments.length < 2 ? THIS : receiver,
        false );
};

Promise.promisifyAll = function Promise$PromisifyAll( target ) {
    if( typeof target !== "function" && typeof target !== "object" ) {
        throw new TypeError( "Cannot promisify " + typeof target );
    }
    return _promisify( target, void 0, true );
};

Promise.prototype._then =
function Promise$_then(
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData,
    caller
) {
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise();

    if( longStackTraces && !haveInternalData ) {
        var haveSameContext = this._peekContext() === this._traceParent;
        ret._traceParent = haveSameContext ? this._traceParent : this;
        ret._setTrace( typeof caller === "function" ?
            caller : this._then, this );

    }

    if( !haveInternalData ) {
        ret._boundTo = this._boundTo;
    }

    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        this._resolveLast(callbackIndex);
    }
    else if( !haveInternalData && this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    if( this._isDelegated() ) {
        this._unsetDelegated();
        var x = this._resolvedValue;
        if( !this._tryThenable( x ) ) {
            this._fulfill(x);
        }
    }
    return ret;
};

Promise.prototype._length = function Promise$_length() {
    return this._bitField & 16777215;
};

Promise.prototype._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return ( this._bitField & 939524096 ) > 0;
};

Promise.prototype._setLength = function Promise$_setLength( len ) {
    this._bitField = ( this._bitField & -16777216 ) |
        ( len & 16777215 ) ;
};

Promise.prototype._cancellable = function Promise$_cancellable() {
    return ( this._bitField & 67108864 ) > 0;
};

Promise.prototype._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setDelegated = function Promise$_setDelegated() {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function Promise$_isFinal() {
    return ( this._bitField & 33554432 ) > 0;
};

Promise.prototype._isDelegated = function Promise$_isDelegated() {
    return ( this._bitField & -1073741824 ) === -1073741824;
};

Promise.prototype._unsetDelegated = function Promise$_unsetDelegated() {
    this._bitField = this._bitField & ( ~-1073741824 );
};

Promise.prototype._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & ( ~67108864 );
};

Promise.prototype._receiverAt = function Promise$_receiverAt( index ) {
    var ret;
    if( index === 0 ) {
        ret = this._receiver0;
    }
    else {
        ret = this[ index + 4 - 5 ];
    }
    if( this._isBound() && ret === void 0 ) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function Promise$_promiseAt( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + 3 - 5 ];
};

Promise.prototype._fulfillAt = function Promise$_fulfillAt( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + 0 - 5 ];
};

Promise.prototype._rejectAt = function Promise$_rejectAt( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + 1 - 5 ];
};

Promise.prototype._progressAt = function Promise$_progressAt( index ) {
    if( index === 0 ) return this._progress0;
    return this[ index + 2 - 5 ];
};

Promise.prototype._unsetAt = function Promise$_unsetAt( index ) {
    if( index === 0 ) {
        this._fulfill0 =
        this._reject0 =
        this._progress0 =
        this._promise0 =
        this._receiver0 = void 0;
    }
    else {
        this[ index - 5 + 0 ] =
        this[ index - 5 + 1 ] =
        this[ index - 5 + 2 ] =
        this[ index - 5 + 3 ] =
        this[ index - 5 + 4 ] = void 0;
    }
};

Promise.prototype._resolveResolver =
function Promise$_resolveResolver( resolver ) {
    this._setTrace( this._resolveResolver, void 0 );
    var p = new PromiseResolver( this );
    this._pushContext();
    var r = tryCatch2( resolver, this, function Promise$_fulfiller( val ) {
        p.fulfill( val );
    }, function Promise$_rejecter( val ) {
        p.reject( val );
    });
    this._popContext();
    if( r === errorObj ) {
        p.reject( r.e );
    }
};

Promise.prototype._addCallbacks = function Promise$_addCallbacks(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    fulfill = typeof fulfill === "function" ? fulfill : void 0;
    reject = typeof reject === "function" ? reject : void 0;
    progress = typeof progress === "function" ? progress : void 0;
    var index = this._length();

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._progress0 = progress;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength( index + 5 );
        return index;
    }

    this[ index - 5 + 0 ] = fulfill;
    this[ index - 5 + 1 ] = reject;
    this[ index - 5 + 2 ] = progress;
    this[ index - 5 + 3 ] = promise;
    this[ index - 5 + 4 ] = receiver;

    this._setLength( index + 5 );
    return index;
};

Promise.prototype._spreadSlowCase =
function Promise$_spreadSlowCase( targetFn, promise, values, boundTo ) {
    promise._assumeStateOf(
            Promise$_All( values, PromiseArray, this._spreadSlowCase, boundTo )
            .promise()
            ._then( function() {
                return targetFn.apply( boundTo, arguments );
            }, void 0, void 0, APPLY, void 0,
                    this._spreadSlowCase ),
        false
    );
};

Promise.prototype._setBoundTo = function Promise$_setBoundTo( obj ) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function Promise$_isBound() {
    return this._boundTo !== void 0;
};


function cast( obj, caller ) {
    if( isObject( obj ) ) {
        if( obj instanceof Promise ) {
            return obj;
        }
        var ref = { ref: null, promise: null };
        if( thenable.is( obj, ref ) ) {
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
                thenable.deleteCache(obj);
                var b = cast( a );
                if( b === a ) {
                    resolver.fulfill( a );
                }
                else {
                    if( a === obj ) {
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
                thenable.deleteCache(obj);
                resolver.reject( a );
            });
            if( ret === errorObj && !called ) {
                resolver.reject( ret.e );
                thenable.deleteCache(obj);
            }
            return resolver.promise;
        }
    }
    return obj;
}

Promise.prototype._resolveThenable =
function Promise$_resolveThenable( x, ref ) {
    if( ref.promise != null ) {
        this._assumeStateOf( ref.promise, true );
        return;
    }
    if( ref.ref === errorObj ) {
        this._attachExtraTrace( ref.ref.e );
        this._reject(ref.ref.e);
    }
    else {
        thenable.addCache( x, this );
        var then = ref.ref;
        var localX = x;
        var localP = this;
        var key = {};
        var called = false;
        var t = function t( v ) {
            if( called && this !== key ) return;
            called = true;
            var fn = localP._fulfill;
            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    fn.call(localP, v);
                    thenable.deleteCache(localX);
                }
                else {
                    b._then( t, r, void 0, key, void 0, t);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                v = v._resolvedValue;
                b = cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b !== v ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }
            fn.call(localP, v);
            thenable.deleteCache(localX);
        };

        var r = function r( v ) {
            if( called && this !== key ) return;
            var fn = localP._reject;
            called = true;

            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    fn.call(localP, v);
                    thenable.deleteCache(localX);
                }
                else {
                    b._then( t, r, void 0, key, void 0, t);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                v = v._resolvedValue;
                b = cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }

            fn.call(localP, v);
            thenable.deleteCache(localX);

        };
        var threw = tryCatch2( then, x, t, r);
        if( threw === errorObj &&
            !called ) {
            this._attachExtraTrace( threw.e );
            this._reject(threw.e);
            thenable.deleteCache(x);
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

var ignore = CatchFilter.prototype.doFilter;
Promise.prototype._resolvePromise = function Promise$_resolvePromise(
    onFulfilledOrRejected, receiver, value, promise
) {
    var isRejected = this.isRejected();

    if( isRejected &&
        typeof value === "object" &&
        value !== null ) {
        var handledState = value["__promiseHandled__"];

        if( handledState === void 0 ) {
            notEnumerableProp( value, "__promiseHandled__", 2 );
        }
        else {
            value["__promiseHandled__"] =
                withHandledMarked( handledState );
        }
    }

    if( !isPromise( promise ) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x;
    if( !isRejected && receiver === APPLY ) {
        if( isArray( value ) ) {
            for( var i = 0, len = value.length; i < len; ++i ) {
                if( isPromise( value[i] ) ) {
                    this._spreadSlowCase(
                        onFulfilledOrRejected,
                        promise,
                        value,
                        this._boundTo
                    );
                    return;
                }
            }
            promise._pushContext();
            x = tryCatchApply( onFulfilledOrRejected, value, this._boundTo );
        }
        else {
            this._spreadSlowCase( onFulfilledOrRejected, promise,
                    value, this._boundTo );
            return;
        }
    }
    else {
        promise._pushContext();
        x = tryCatch1( onFulfilledOrRejected, receiver, value );
    }

    promise._popContext();

    if( x === errorObj ) {
        ensureNotHandled(x.e);
        if( onFulfilledOrRejected !== ignore ) {
            promise._attachExtraTrace( x.e );
        }
        promise._reject(x.e);
    }
    else if( x === promise ) {
        var selfResolutionError =
            new TypeError( "Circular thenable chain" );
        this._attachExtraTrace( selfResolutionError );
        promise._reject(selfResolutionError);
    }
    else {
        if( promise._tryAssumeStateOf( x, true ) ) {
            return;
        }
        else if( thenable.couldBe( x ) ) {

            if( promise._length() === 0 ) {
                promise._resolvedValue = x;
                promise._setDelegated();
                return;
            }
            else if( promise._tryThenable( x ) ) {
                return;
            }
        }
        promise._fulfill(x);
    }
};

Promise.prototype._assumeStateOf =
function Promise$_assumeStateOf( promise, mustAsync ) {
    this._setFollowing();
    if( promise.isPending() ) {
        if( promise._cancellable()  ) {
            this._cancellationParent = promise;
        }
        promise._then(
            this._resolveFulfill,
            this._resolveReject,
            this._resolveProgress,
            this,
            void 0,            this._tryAssumeStateOf
        );
    }
    else if( promise.isFulfilled() ) {
        if( mustAsync === true )
            this._resolveFulfill(promise._resolvedValue);
        else
            this._resolveFulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync === true )
            this._resolveReject(promise._resolvedValue);
        else
            this._resolveReject( promise._resolvedValue );
    }

    if( longStackTraces &&
        promise._traceParent == null ) {
        promise._traceParent = this;
    }
};

Promise.prototype._tryAssumeStateOf =
function Promise$_tryAssumeStateOf( value, mustAsync ) {
    if( !isPromise( value ) ||
        this._isFollowingOrFulfilledOrRejected() ) return false;

    this._assumeStateOf( value, mustAsync );
    return true;
};

Promise.prototype._setTrace = function Promise$_setTrace( caller, parent ) {
    if( longStackTraces ) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        if( parent !== void 0 &&
            parent._traceParent === context ) {
            this._trace = parent._trace;
        }
        else {
            this._trace = new CapturedTrace(
                typeof caller === "function"
                ? caller
                : this._setTrace,
                isTopLevel
            );
        }
    }
    return this;
};

Promise.prototype._attachExtraTrace =
function Promise$_attachExtraTrace( error ) {
    if( longStackTraces &&
        canAttach( error ) ) {
        var promise = this;
        var stack = error.stack;
        stack = typeof stack === "string"
            ? stack.split("\n") : [];
        var headerLineCount = 1;

        while( promise != null &&
            promise._trace != null ) {
            stack = CapturedTrace.combine(
                stack,
                promise._trace.stack.split( "\n" )
            );
            promise = promise._traceParent;
        }

        var max = Error.stackTraceLimit + headerLineCount;
        var len = stack.length;
        if( len  > max ) {
            stack.length = max;
        }
        if( stack.length <= headerLineCount ) {
            error.stack = "(No stack trace)";
        }
        else {
            error.stack = stack.join("\n");
        }
        error["__promiseHandled__"] =
            withStackAttached( error["__promiseHandled__"] );
    }
};

Promise.prototype._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection( reason ) {
    if( !isHandled( reason["__promiseHandled__"] ) ) {
        reason["__promiseHandled__"] =
            withHandledMarked( reason["__promiseHandled__"] );
        CapturedTrace.possiblyUnhandledRejection( reason, this );
    }
};

Promise.prototype._unhandledRejection =
function Promise$_unhandledRejection( reason ) {
    if( !isHandled( reason["__promiseHandled__"] ) ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

Promise.prototype._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

Promise.prototype._fulfill = function Promise$_fulfill( value ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveFulfill( value );

};

Promise.prototype._reject = function Promise$_reject( reason ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveReject( reason );
};

Promise.prototype._progress = function Promise$_progress( progressValue ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveProgress( progressValue );

};

Promise.prototype._doResolveAt = function Promise$_doResolveAt( i ) {
    var fn = this.isFulfilled()
        ? this._fulfillAt( i )
        : this._rejectAt( i );
    var value = this._resolvedValue;
    var receiver = this._receiverAt( i );
    var promise = this._promiseAt( i );
    this._unsetAt( i );
    this._resolvePromise( fn, receiver, value, promise );
};

Promise.prototype._resolveFulfill = function Promise$_resolveFulfill( value ) {
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    var len = this._length();
    this._setLength( 0 );
    for( var i = 0; i < len; i+= 5 ) {
        if( this._fulfillAt( i ) !== void 0 ) {
            this._doResolveAt(i);
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            promise._fulfill(value);
        }
    }

};

Promise.prototype._resolveLast = function Promise$_resolveLast( index ) {
    this._setLength( 0 );
    var fn;
    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else {
        fn = this._rejectAt( index );
    }

    if( fn !== void 0 ) {
        this._doResolveAt(index);
    }
    else {
        var promise = this._promiseAt( index );
        var value = this._resolvedValue;
        this._unsetAt( index );
        if( this.isFulfilled() ) {
            promise._fulfill(value);
        }
        else {
            promise._reject(value);
        }
    }

};

Promise.prototype._resolveReject = function Promise$_resolveReject( reason ) {
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = reason;
    if( this._isFinal() ) {
        async.invokeLater( thrower, void 0, reason );
        return;
    }
    var len = this._length();
    this._setLength( 0 );
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= 5 ) {
        if( this._rejectAt( i ) !== void 0 ) {
            rejectionWasHandled = true;
            this._doResolveAt(i);
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            if( !rejectionWasHandled )
                rejectionWasHandled = promise._length() > 0;
            promise._reject(reason);
        }
    }

    if( !rejectionWasHandled &&
        CapturedTrace.possiblyUnhandledRejection !== void 0
    ) {

        if( isObject( reason ) ) {
            var handledState = reason["__promiseHandled__"];
            var newReason = reason;

            if( handledState === void 0 ) {
                newReason = ensurePropertyExpansion(reason,
                    "__promiseHandled__", 0 );
                handledState = 0;
            }
            else if( isHandled( handledState ) ) {
                return;
            }

            if( !isStackAttached( handledState ) )  {
                this._attachExtraTrace( newReason );
            }
            this._unhandledRejection(newReason);

        }
    }

};

Promise.prototype._resolveProgress =
function Promise$_resolveProgress( progressValue ) {
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        if( !isPromise( promise ) ) {
            fn.call( this._receiverAt( i ), progressValue, promise );
            continue;
        }
        var ret = progressValue;
        if( fn !== void 0 ) {
            this._pushContext();
            ret = tryCatch1( fn, this._receiverAt( i ), progressValue );
            this._popContext();
            if( ret === errorObj ) {
                if( ret.e != null &&
                    ret.e.name === "StopProgressPropagation" ) {
                    ret.e["__promiseHandled__"] = 2;
                }
                else {
                    promise._attachExtraTrace( ret.e );
                    promise._progress(ret.e);
                }
            }
            else if( isPromise( ret ) ) {
                ret._then( promise._progress, null, null, promise, void 0,
                    this._progress );
            }
            else {
                promise._progress(ret);
            }
        }
        else {
            promise._progress(ret);
        }
    }
};

var contextStack = [];
Promise.prototype._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if( lastIndex >= 0 ) {
        return contextStack[ lastIndex ];
    }
    return void 0;

};

Promise.prototype._pushContext = function Promise$_pushContext() {
    if( !longStackTraces ) return;
    contextStack.push( this );
};

Promise.prototype._popContext = function Promise$_popContext() {
    if( !longStackTraces ) return;
    contextStack.pop();
};


function Promise$_All( promises, PromiseArray, caller, boundTo ) {
    if( isPromise( promises ) ||
        isArray( promises ) ) {

        return new PromiseArray(
            promises,
            typeof caller === "function"
                ? caller
                : Promise$_All,
            boundTo
        );
    }
    return new PromiseArray(
        [ apiRejection( "expecting an array or a promise" ) ],
        caller,
        boundTo
    );
}

var old = global.Promise;

Promise.noConflict = function() {
    if( global.Promise === Promise ) {
        global.Promise = old;
    }
    return Promise;
};


if( !CapturedTrace.isSupported() ) {
    Promise.longStackTraces = function(){};
    CapturedTrace.possiblyUnhandledRejection = function(){};
    Promise.onPossiblyUnhandledRejection = function(){};
    longStackTraces = false;
}


Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;

module.exports = Promise;
