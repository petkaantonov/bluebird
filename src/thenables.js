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
        ASSERT(typeof then === "function");

        function resolveFromThenable( a ) {
            if( called ) return;
            called = true;

            if (a === x) {
                ASSERT( resolver.promise.isPending() );
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
