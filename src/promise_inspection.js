"use strict";
var TypeError = require("./errors.js").TypeError;

//Based on
//https://github.com/promises-aplus/synchronous-inspection-spec/issues/6

//Not exactly like that spec because optional properties are like kryptonite
//whereas calls to short functions don't have any penalty and are just
//easier to use than properties (error on mistyping for example).
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
/**
 * See if the underlying promise was fulfilled at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
PromiseInspection.prototype.isFulfilled =
function PromiseInspection$isFulfilled() {
    return (this._bitField & IS_FULFILLED) > 0;
};

/**
 * See if the underlying promise was rejected at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
PromiseInspection.prototype.isRejected =
function PromiseInspection$isRejected() {
    return (this._bitField & IS_REJECTED) > 0;
};

/**
 * See if the underlying promise was pending at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
PromiseInspection.prototype.isPending = function PromiseInspection$isPending() {
    return (this._bitField & IS_REJECTED_OR_FULFILLED) === 0;
};

/**
 * Get the fulfillment value of the underlying promise. Throws
 * if the promise wasn't fulfilled at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
PromiseInspection.prototype.value = function PromiseInspection$value() {
    if (!this.isFulfilled()) {
        throw new TypeError(INSPECTION_VALUE_ERROR);
    }
    return this._settledValue;
};

/**
 * Get the rejection reason for the underlying promise. Throws
 * if the promise wasn't rejected at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
PromiseInspection.prototype.error = function PromiseInspection$error() {
    if (!this.isRejected()) {
        throw new TypeError(INSPECTION_REASON_ERROR);
    }
    return this._settledValue;
};

module.exports = PromiseInspection;
