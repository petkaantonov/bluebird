"use strict";
module.exports =
    function(Promise, PromiseArray) {
var ASSERT = require("./assert.js");
var PromiseInspection = Promise.PromiseInspection;
var util = require("./util.js");

function SettledPromiseArray(values, boundTo) {
    this.constructor$(values, boundTo);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved =
function SettledPromiseArray$_promiseResolved(index, inspection) {
    ASSERT(typeof index === "number");
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

//override
SettledPromiseArray.prototype._promiseFulfilled =
function SettledPromiseArray$_promiseFulfilled(value, index) {
    if (this._isResolved()) return;
    ASSERT(typeof index === "number");
    var ret = new PromiseInspection();
    ret._bitField = IS_FULFILLED;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
//override
SettledPromiseArray.prototype._promiseRejected =
function SettledPromiseArray$_promiseRejected(reason, index) {
    if (this._isResolved()) return;
    ASSERT(typeof index === "number");
    var ret = new PromiseInspection();
    ret._bitField = IS_REJECTED;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

function Promise$_Settle(promises, useBound) {
    return new SettledPromiseArray(promises,
                                   useBound === USE_BOUND && promises._isBound()
                                    ? promises._boundTo
                                    : void 0).promise();
}

Promise.settle = function Promise$Settle(promises) {
    return Promise$_Settle(promises, DONT_USE_BOUND);
};

Promise.prototype.settle = function Promise$settle() {
    return Promise$_Settle(this, USE_BOUND);
};
};
