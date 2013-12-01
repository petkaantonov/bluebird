"use strict";
module.exports = function(Promise, INTERNAL) {
    var util = require("./util.js");
    var ASSERT = require("./assert.js");
    var apiRejection = require("./errors_api_rejection")(Promise);
    var TimeoutError = Promise.TimeoutError;
    var global = require("./global.js");
    var setTimeout = function(fn, time) {
        INLINE_SLICE(args, arguments, 2);
        global.setTimeout(function() {
            fn.apply(void 0, args);
        }, time);
    };

    //Feature detect set timeout that passes arguments.
    //
    //Because it cannot be done synchronously
    //the setTimeout defaults to shim and later on
    //will start using the faster (can be used without creating closures) one
    //if available (i.e. not <=IE8)
    var pass = {};
    global.setTimeout( function(_) {
        if(_ === pass) {
            setTimeout = global.setTimeout;
        }
    }, 1, pass);

    var promiseDelayer = function Promise$_promiseDelayer(value, ms) {
        ASSERT(this instanceof Promise);
        ASSERT(typeof ms === "number");
        setTimeout(delayer, ms, value, this);
    };

    var delayer = function Promise$_delayer(value, promise) {
        promise._fulfill(value);
    };

    Promise.delay = function Promise$Delay(value, ms) {
        if (ms === void 0) {
            ms = value;
            value = void 0;
        }
        if ((ms | 0) !== ms || ms < 0) {
            return apiRejection("Promise.delay expects a positive integer");
        }
        var maybePromise = Promise._cast(value, Promise.delay, void 0);
        var promise = new Promise(INTERNAL);
        promise._setTrace(Promise.delay, void 0);
        if (Promise.is(maybePromise)) {
            maybePromise._then(
                promiseDelayer,
                promise._reject,
                promise._progress,
                promise,
                ms,
                Promise.delay
            )
        }
        else {
            setTimeout(delayer, ms, value, promise);
        }
        return promise;
    };

    var timeouter = function Promise$_timeouter(promise, message, ms) {
        if (typeof message !== "string") {
            message = "Operation timed out after " + ms + " ms"
        }
        var err = new TimeoutError(message)
        promise._attachExtraTrace(err);
        promise._reject(err);
    };

    Promise.prototype.timeout = function Promise$timeout(ms, message) {
        if ((ms | 0) !== ms || ms < 0) {
            return apiRejection("Promise.prototype.timeout " +
                "expects a positive integer");
        }

        var ret = new Promise(INTERNAL);
        ret._setTrace(this.timeout, this);

        if (this._isBound()) ret._setBoundTo(this._boundTo);
        if (this._cancellable()) {
            ret._setCancellable();
            ret._cancellationParent = this;
        }

        this._then(ret._fulfill, ret._reject, ret._progress,
            ret, null, this.timeout);

        setTimeout(timeouter, ms, ret, message, ms);

        return ret;
    };

};
