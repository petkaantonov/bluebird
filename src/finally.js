"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = require("./util.js");
var errorObj = util.errorObj;

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue);
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
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
                if (this.cancelPromise != null) {
                    if (maybePromise.isCancelled()) {
                        checkCancel(this);
                    } else if (maybePromise.isPending()) {
                        var ctx = this;
                        var oldOnCancel = maybePromise._onCancel;
                        maybePromise._onCancel = function() {
                            checkCancel(ctx);
                            maybePromise._invokeOnCancel(oldOnCancel);
                        };
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success, fail, undefined, {
        promise: this,
        handler: handler,
        called: false,
        cancelPromise: null
    }, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler, finallyHandler, finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, finallyHandler);
};

return finallyHandler;
};
