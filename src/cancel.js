"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var ASSERT = require("./assert");
var util = require("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

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
        promise._invokeOnCancel(promise._onCancel(), false);
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

Promise.prototype._cancel = function() {
    if (!this.isCancellable()) return;
    ASSERT(!this._isFollowing());
    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
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

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundTo);
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

// onCancelCallback is passed in to avoid duplicating the logic of determining
// the callback (I.E. if callback is a Promise, the callback is that promise's
// .cancel() method, or if a callback is a PromiseArray, the callback is that
// promiseArray's ._resultCancelled() method etc).
Promise.prototype._invokeOnCancel = function(onCancelCallback) {
    // The existence of onCancel handler on a promise signals that the handler
    // has not been queued for invocation yet.
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this.isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};
