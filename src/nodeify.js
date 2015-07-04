"use strict";
module.exports = function(Promise) {
var util = require("./util.js");
var async = require("./async.js");
var ASSERT = require("./assert.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret = tryCatch(nodeback).apply(promise._boundTo, [null].concat(val));
    if (ret === errorObj) {
        var e = errorObj.e;
        errorObj.e = null;
        async.throwLater(e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundTo;
    ASSERT(typeof nodeback == "function");
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        var e = errorObj.e;
        errorObj.e = null;
        async.throwLater(e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        ASSERT(target._isCarryingStackTrace());
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
        ASSERT(!!reason);
    }
    ASSERT(typeof nodeback == "function");
    var ret = tryCatch(nodeback).call(promise._boundTo, reason);
    if (ret === errorObj) {
        var e = errorObj.e;
        errorObj.e = null;
        async.throwLater(e);
    }
}

Promise.prototype.asCallback = 
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};
