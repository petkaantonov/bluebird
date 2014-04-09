"use strict";
module.exports = function(Promise) {
var util = require("./util.js");
var async = require("./async.js");
var ASSERT = require("./assert.js");
var tryCatch2 = util.tryCatch2;
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function thrower(r) {
    throw r;
}

function Promise$_successAdapter(val, receiver) {
    var nodeback = this;
    ASSERT(typeof nodeback == "function");
    var ret;
    if (val === undefined) {
        // got no result, or result value is undefined.
        //   ensure that the nodeback receives (arguments.length === 1),
        //   since there is 'no result'.  arguments[1] will still be undefined.
        ret = tryCatch1(nodeback, receiver, null);
    }
    else {
        // provide the result value
        ret = tryCatch2(nodeback, receiver, null, val);
    }
    if (ret === errorObj) {
        async.invokeLater(thrower, void 0, ret.e);
    }
}
function Promise$_errorAdapter(reason, receiver) {
    var nodeback = this;
    ASSERT(typeof nodeback == "function");
    var ret = tryCatch1(nodeback, receiver, reason);
    if (ret === errorObj) {
        async.invokeLater(thrower, void 0, ret.e);
    }
}

Promise.prototype.nodeify = function Promise$nodeify(nodeback) {
    if (typeof nodeback == "function") {
        this._then(
            Promise$_successAdapter,
            Promise$_errorAdapter,
            void 0,
            nodeback,
            this._isBound() ? this._boundTo : null
        );
    }
    return this;
};
};
