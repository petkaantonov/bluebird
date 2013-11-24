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
module.exports = function( Promise ) {
    var ASSERT = require("./assert.js");
    var async = require( "./async.js" );
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;

    function getThen(obj) {
        try {
            return obj.then;
        }
        catch(e) {
            errorObj.e = e;
            return errorObj;
        }
    }

    function isThenable(obj, ref) {
        if (isPrimitive(obj)) {
            return false;
        }
        var then = getThen(obj);

        if (then === errorObj) {
            ref.ref = errorObj;
            return false;
        }

        if (typeof then === "function") {
            ref.ref = then;
            return true;
        }
        return false;
    }

    var ref = {ref: null};
    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }

            if( isThenable( obj, ref ) ) {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                var then = ref.ref;
                ref.ref = null;
                return doThenable( obj, then, caller );
            }
            else if (ref.ref === errorObj) {
                ref.ref = null;
                return Promise.reject(errorObj.e);
            }
            ref.ref = null;
        }
        return obj;
    }

    Promise._cast = Promise$_Cast;
    Promise._isThenable = isThenable;

    function doThenable( x, then, caller ) {
        function resolveFromThenable( a ) {
            if( called ) return;
            called = true;

            if (a === x) {
                resolver.promise._resolveFulfill( a );
                return;
            }
            var b = Promise$_Cast( a );
            if( b === a ) {
                resolver.resolve( a );
            }
            else {
                b._then(
                    resolver.resolve,
                    resolver.reject,
                    void 0,
                    resolver,
                    void 0,
                    resolveFromThenable
                );
            }

        }

        function rejectFromThenable( a ) {
            if( called ) return;
            called = true;
            resolver.reject( a );
        }


        var resolver = Promise.defer( caller );

        var called = false;
        var ret = tryCatch2(then, x, resolveFromThenable, rejectFromThenable);
        if( ret === errorObj && !called ) {
            resolver.reject( ret.e );
        }
        return resolver.promise;
    }

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable(x, then) {
        var localP = this;
        var key = {};
        var called = false;

        function resolveFromThenable( v ) {
            if( called && this !== key ) return;
            called = true;
            var fn = localP._fulfill;
            var b = Promise$_Cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    async.invoke( fn, localP, v );
                }
                else {
                    b._then( resolveFromThenable, rejectFromThenable, void 0,
                        key, void 0, resolveFromThenable);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                v = v._resolvedValue;
                b = Promise$_Cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b !== v ) ) {
                    b._then(resolveFromThenable, rejectFromThenable, void 0,
                        key, void 0, resolveFromThenable);
                    return;
                }
            }
            async.invoke( fn, localP, v );
        }

        function rejectFromThenable( v ) {
            if( called && this !== key ) return;
            var fn = localP._reject;
            called = true;

            var b = Promise$_Cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    async.invoke( fn, localP, v );
                }
                else {
                    b._then(resolveFromThenable, rejectFromThenable, void 0,
                        key, void 0, resolveFromThenable);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                v = v._resolvedValue;
                b = Promise$_Cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    b._then(resolveFromThenable, rejectFromThenable, void 0,
                        key, void 0, resolveFromThenable);
                    return;
                }
            }

            async.invoke( fn, localP, v );
        }
        var threw = tryCatch2( then, x,
                resolveFromThenable, rejectFromThenable);

        if( threw === errorObj &&
            !called ) {
            this._attachExtraTrace( threw.e );
            async.invoke( this._reject, this, threw.e );
        }
    };
};
