"use strict";
var global = require("./global.js");
var setTimeout = function(fn, ms) {
    INLINE_SLICE(args, arguments, 2);
    global.setTimeout(function(){
        fn.apply(void 0, args);
    }, ms);
};

module.exports = function(Promise, INTERNAL, cast) {
var util = require("./util.js");
var ASSERT = require("./assert.js");
var errors = require("./errors.js");
var apiRejection = require("./errors_api_rejection")(Promise);
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function Promise$_afterTimeout(promise, message, ms) {
    //Don't waste time concatting strings or creating stack traces
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = TIMEOUT_ERROR + " " + ms + " ms"
    }
    var err = new TimeoutError(message);
    errors.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._rejectUnchecked(err);
};

var afterDelay = function Promise$_afterDelay(value, promise) {
    promise._fulfill(value);
};

var delay = Promise.delay = function Promise$Delay(value, ms) {
    if (ms === void 0) {
        ms = value;
        value = void 0;
    }
    ms = +ms;
    var maybePromise = cast(value, void 0);
    var promise = new Promise(INTERNAL);

    if (maybePromise instanceof Promise) {
        if (maybePromise._isBound()) {
            promise._setBoundTo(maybePromise._boundTo);
        }
        if (maybePromise._cancellable()) {
            promise._setCancellable();
            promise._cancellationParent = maybePromise;
        }
        promise._setTrace(maybePromise);
        promise._follow(maybePromise);
        return promise.then(function(value) {
            return Promise.delay(value, ms);
        });
    }
    else {
        promise._setTrace(void 0);
        setTimeout(afterDelay, ms, value, promise);
    }
    return promise;
};

Promise.prototype.delay = function Promise$delay(ms) {
    return delay(this, ms);
};

Promise.prototype.timeout = function Promise$timeout(ms, message) {
    ms = +ms;

    var ret = new Promise(INTERNAL);
    ret._setTrace(this);

    if (this._isBound()) ret._setBoundTo(this._boundTo);
    if (this._cancellable()) {
        ret._setCancellable();
        ret._cancellationParent = this;
    }
    ret._follow(this);
    setTimeout(afterTimeout, ms, ret, message, ms);
    return ret;
};

};
