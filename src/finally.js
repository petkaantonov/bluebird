"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = require("./util.js");
var errorObj = util.errorObj;

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue);
}
function fail(reason) {
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = handler.call(promise._boundTo);
        if (ret !== undefined) {
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success, fail, undefined, {
        promise: this,
        handler: handler,
        called: false
    }, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler, finallyHandler, finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, finallyHandler);
};
};
