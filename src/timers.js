"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var util = require("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    //Don't waste time concatting strings or creating stack traces
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = TIMEOUT_ERROR;
    }
    var err = new TimeoutError(message);
    util.markAsOriginatingFromRejection(err);
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
        promise._propagateFrom(maybePromise, PROPAGATE_BIND | PROPAGATE_CANCEL);
        promise._follow(maybePromise._target());
        return promise.then(function(value) {
            return Promise.delay(value, ms);
        });
    } else {
        setTimeout(function delayTimeout() {
            afterDelay(value, promise);
        }, ms);
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
    var target = this._target();
    ms = +ms;
    var ret = new Promise(INTERNAL).cancellable();
    ret._propagateFrom(this, PROPAGATE_BIND | PROPAGATE_CANCEL);
    ret._follow(target);
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};
