"use strict";
var ASSERT = require("./assert.js");
var _setTimeout = function(fn, ms) {
    var len = arguments.length;
    ASSERT(4 <= len && len <= 5);
    var arg0 = arguments[2];
    var arg1 = arguments[3];
    var arg2 = len >= 5 ? arguments[4] : undefined;
    return setTimeout(function() {
        fn(arg0, arg1, arg2);
    }, ms|0);
};

module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var util = require("./util.js");
var errors = require("./errors.js");
var apiRejection = require("./errors_api_rejection")(Promise);
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, parent, message) {
    //Don't waste time concatting strings or creating stack traces
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = TIMEOUT_ERROR;
    }
    var err = new TimeoutError(message);
    errors.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterDelay = function (value, promise) {
    promise._fulfill(value);
};

var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
    }
    ms = +ms;
    var maybePromise = tryConvertToPromise(value, undefined);
    var promise = new Promise(INTERNAL);

    if (maybePromise instanceof Promise) {
        promise._propagateFrom(maybePromise, PROPAGATE_ALL);
        promise._follow(maybePromise);
        return promise.then(function(value) {
            return Promise.delay(value, ms);
        });
    } else {
        promise._setTrace(undefined);
        _setTimeout(afterDelay, ms, value, promise);
    }
    return promise;
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    // Deal with non-strict mode wrapping.
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    // Deal with non-strict mode wrapping.
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = new Promise(INTERNAL).cancellable();
    ret._propagateFrom(this, PROPAGATE_ALL);
    ret._follow(this);
    var handle = _setTimeout(afterTimeout, ms, ret, this, message);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};
