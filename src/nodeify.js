"use strict";
module.exports = function(Promise) {
var util = require("./util");
var ASSERT = require("./assert");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
    
function spreadAdapter(nodeback) {
    ASSERT(typeof nodeback == "function");
    return function (val) {
        var result = val === undefined
            ? tryCatch(nodeback).call(this._boundValue(), [null])
            : tryCatch(nodeback).apply(this._boundValue(), [null].concat(val));
        
        if (result === errorObj)
            return Promise.reject(result.e);
        return Promise.resolve(result);
    };
}

function successAdapter(nodeback) {
    ASSERT(typeof nodeback == "function");
    return function (val) {
        var result = val === undefined
            ? tryCatch(nodeback).call(this._boundValue(), null)
            : tryCatch(nodeback).call(this._boundValue(), null, val);
        
        if (result === errorObj)
            return Promise.reject(result.e);
        return Promise.resolve(result);
    };
}

function errorAdapter(nodeback) {
    ASSERT(typeof nodeback == "function");
    return function (reason) {
        if (!reason) {
            var newReason = new Error(reason + "");
            newReason.cause = reason;
            reason = newReason;
            ASSERT(!!reason);
        }
        
        var result = tryCatch(nodeback).call(this._boundValue(), reason);
        
        if (result === errorObj)
            return Promise.reject(result.e);
        return Promise.resolve(result);
    };
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread)
            adapter = spreadAdapter;
        
        return this._then(
            adapter(nodeback),
            errorAdapter(nodeback),
            undefined,
            this,
            undefined);
        
    } else {
        return this;
    }
};
};
