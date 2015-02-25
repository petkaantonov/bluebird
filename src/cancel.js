"use strict";
module.exports = function(Promise, apiRejection, debug) {
var ASSERT = require("./assert");
var util = require("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype._cancel = function() {
    if (!this.isCancellable()) return;
    ASSERT(!this._isFollowing());
    this._setCancelled();
    if (this._length() > 0) {
        async.invoke(this._cancelPromises, this, undefined);
    }
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    ASSERT(this.isCancellable() || this.isCancelled());
    this._onCancelField = undefined;
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype.onCancel = function(onCancel) {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");
    if (typeof onCancel !== "function") {
        return apiRejection("onCancel must be a function, got: "
            + util.toString(onCancel));
    }
    this._attachCancellationCallback(onCancel);
    return this;
};

Promise.prototype._doInvokeOnCancel = function(callback) {
    if (callback !== undefined) {
        if (typeof callback === "function") {
            var e = tryCatch(callback).call(this._boundTo);
            if (e === errorObj) {
                this._attachExtraTrace(e.e);
                async.throwLater(e.e);
            }
        } else if (callback instanceof Promise) {
            callback.cancel();
        } else {
            callback._resultCancelled(this);
        }
        this._unsetOnCancel();
    }
};

Promise.prototype._invokeOnCancel = function(callback) {
    async.invoke(this._doInvokeOnCancel, this, callback);
};

Promise.prototype.cancelAfter = function(ms) {
    var self = this;
    setTimeout(function() {
        self.cancel();
    }, ms);
};

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    while (promise.isCancellable()) {
        promise._invokeOnCancel(promise._onCancel());
        var parent = promise._cancellationParent;
        if (parent == null || !parent.isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancel();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            promise = parent;
        }
    }
};

};
