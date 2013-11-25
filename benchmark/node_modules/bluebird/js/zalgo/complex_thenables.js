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
    var util = require( "./util.js" );
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

    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }
            var then = getThen(obj);
            if (then === errorObj) {
                return Promise.reject(then.e);
            }
            else if (typeof then === "function") {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return doThenable(obj, then, caller);
            }
        }
        return obj;
    }

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
                    null,
                    resolveFromThenable
                );
            }

        }

        function rejectFromThenable( a ) {
            if( called ) return;
            called = true;
            resolver.reject( a );
        }


        var resolver = Promise.defer(caller);

        var called = false;
        var ret = tryCatch2(then, x, resolveFromThenable, rejectFromThenable);
        if( ret === errorObj && !called ) {
            resolver.reject( ret.e );
        }
        return resolver.promise;
    }

    Promise._cast = Promise$_Cast;
};
