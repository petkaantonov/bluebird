"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var ASSERT = require("./assert.js");

function returnThis() { return this.value; }
function throwThis() { throw this.reason; }
function awaitBindingThenResolve(value) {
    return this._then(returnThis, null, null, {value: value}, undefined);
}
function awaitBindingThenReject(reason) {
    return this._then(throwThis, throwThis, null, {reason: reason}, undefined);
}
function setBinding(binding) { this._setBoundTo(binding); }
Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    if (maybePromise instanceof Promise) {
        if (maybePromise.isFulfilled()) {
            thisArg = maybePromise.value();
        } else if (maybePromise.isRejected()) {
            return Promise.reject(maybePromise.reason());
        } else {
            var ret = this.then();
            var parent = ret;
            ret = ret._then(awaitBindingThenResolve,
                            awaitBindingThenReject,
                            null, maybePromise, undefined);
            maybePromise._then(setBinding, ret._reject, null, ret, null);
            // In case ret is set to cancellable in future, parent must be
            // set to cancellable as well.
            if (!ret._cancellable()) ret._setPendingCancellationParent(parent);
            return ret;
        }
    }
    var ret = this.then();
    ret._setBoundTo(thisArg);
    return ret;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};

Promise.prototype._setPendingCancellationParent = function(parent) {
    ASSERT(this.isPending());
    ASSERT(parent.isPending());
    ASSERT(!this._cancellable());
    ASSERT(!parent._cancellable());
    ASSERT(parent instanceof Promise);
    this._settledValue = parent;
};

Promise.prototype._pendingCancellationParent = function() {
    if (this.isPending() && this._settledValue !== undefined) {
        ASSERT(this._settledValue instanceof Promise);
        var ret = this._settledValue;
        ASSERT(!ret._cancellable());
        ret.cancellable();
        this._settledValue = undefined;
        return ret;
    }
};

Promise.prototype._setIsMigratingBinding = function () {
    this._bitField = this._bitField | IS_MIGRATING_BINDING;
};

Promise.prototype._unsetIsMigratingBinding = function () {
    this._bitField = this._bitField & (~IS_MIGRATING_BINDING);
};

Promise.prototype._isMigratingBinding = function () {
    return (this._bitField & IS_MIGRATING_BINDING) === IS_MIGRATING_BINDING;
};

Promise.prototype._setBoundTo = function (obj) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function () {
    return this._boundTo !== undefined;
};
};
