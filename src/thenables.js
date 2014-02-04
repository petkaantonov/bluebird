"use strict";
module.exports = function(Promise, INTERNAL) {
    var ASSERT = require("./assert.js");
    var util = require("./util.js");
    var errorObj = util.errorObj;
    var isObject = util.isObject;

    function getThen(obj) {
        try {
            return obj.then;
        }
        catch(e) {
            errorObj.e = e;
            return errorObj;
        }
    }

    function Promise$_Cast(obj, caller, originalPromise) {
        ASSERT(arguments.length === 3);
        if (isObject(obj)) {
            if (obj instanceof Promise) {
                return obj;
            }
            var then = getThen(obj);
            if (then === errorObj) {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                if (originalPromise !== void 0) {
                    originalPromise._attachExtraTrace(then.e);
                }
                return Promise.reject(then.e, caller);
            }
            else if (typeof then === "function") {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return Promise$_doThenable(obj, then, caller, originalPromise);
            }
        }
        return obj;
    }

    function isAnyBluebirdPromise(obj) {
        try {
            return typeof obj._resolveFromSyncValue === "function";
        }
        catch(ignore) {
            return false;
        }
    }

    function Promise$_doThenable(x, then, caller, originalPromise) {
        ASSERT(typeof then === "function");
        ASSERT(arguments.length === 4);
        //Make casting from another bluebird fast
        if (isAnyBluebirdPromise(x)) {
            var ret = new Promise(INTERNAL);
            ret._follow(x);
            ret._setTrace(caller, void 0);
            return ret;
        }
        return Promise$_doThenableSlowCase(x, then, caller, originalPromise);
    }

    function Promise$_doThenableSlowCase(x, then, caller, originalPromise) {
        var resolver = Promise.defer(caller);
        var called = false;
        try {
            then.call(
                x,
                Promise$_resolveFromThenable,
                Promise$_rejectFromThenable,
                Promise$_progressFromThenable
            );
        }
        catch(e) {
            if (!called) {
                called = true;
                if (originalPromise !== void 0) {
                    originalPromise._attachExtraTrace(e);
                }
                resolver.promise._reject(e);
            }
        }
        return resolver.promise;

        function Promise$_resolveFromThenable(y) {
            if (called) return;
            called = true;

            if (x === y) {
                var e = Promise._makeSelfResolutionError();
                if (originalPromise !== void 0) {
                    originalPromise._attachExtraTrace(e);
                }
                resolver.promise._reject(e);
                return;
            }
            resolver.resolve(y);
        }

        function Promise$_rejectFromThenable(r) {
            if (called) return;
            called = true;

            if (originalPromise !== void 0) {
                originalPromise._attachExtraTrace(r);
            }
            resolver.promise._attachExtraTrace(r);
            resolver.promise._reject(r);
        }

        function Promise$_progressFromThenable(v) {
            if (called) return;
            var promise = resolver.promise;
            if (typeof promise._progress === "function") {
                promise._progress(v);
            }
        }
    }

    Promise._cast = Promise$_Cast;
};
