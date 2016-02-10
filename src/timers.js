"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = require("./util");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message, parent) {
    //Don't waste time concatting strings or creating stack traces
    if (!promise.isPending()) return;
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError(TIMEOUT_ERROR);
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);
    if (debug.cancellation()) {
        parent.cancel();
    }
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel({
                _resultCancelled: function() {
                    clearTimeout(handle);
                }
            });
        }
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}


Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var parent = this.then();
    var ret = parent.then();
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message, parent);
    }, ms);
    if (debug.cancellation()) {
        ret._setOnCancel({
            _resultCancelled: function() {
                clearTimeout(handle);
            }
        });
    }
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};
