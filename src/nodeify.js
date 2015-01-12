"use strict";
module.exports = function(Promise) {
var util = require("./util.js");
var async = require("./async.js");
var ASSERT = require("./assert.js");
var tryCatch2 = util.tryCatch2;
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret = util.tryCatchApply(nodeback,
                                 [null].concat(val), promise._boundTo);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundTo;
    ASSERT(typeof nodeback == "function");
    var ret = val === undefined
        ? tryCatch1(nodeback, receiver, null)
        : tryCatch2(nodeback, receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
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
    var ret = tryCatch1(nodeback, promise._boundTo, reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

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
