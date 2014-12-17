"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== void 0) {
        this._bitField = promise._bitField;
        this._settledValue = promise.isResolved()
            ? promise._settledValue
            //Don't keep a reference to something that will never be
            //used
            : void 0;
    }
    else {
        this._bitField = 0;
        this._settledValue = void 0;
    }
}

PromiseInspection.prototype.isFulfilled =
Promise.prototype.isFulfilled = function () {
    return (this._bitField & IS_FULFILLED) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype.isRejected = function () {
    return (this._bitField & IS_REJECTED) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype.isPending = function () {
    return (this._bitField & IS_REJECTED_OR_FULFILLED) === 0;
};

PromiseInspection.prototype.value =
Promise.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError(INSPECTION_VALUE_ERROR);
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason =
Promise.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError(INSPECTION_REASON_ERROR);
    }
    return this._settledValue;
};

PromiseInspection.prototype.isResolved =
Promise.prototype.isResolved = function () {
    return (this._bitField & IS_REJECTED_OR_FULFILLED) > 0;
};

Promise.PromiseInspection = PromiseInspection;
};
