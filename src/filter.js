"use strict";
module.exports = function(Promise, Promise$_All, PromiseArray, apiRejection) {

    var ASSERT = require("./assert.js");

    function Promise$_filterer(values) {
        var fn = this;
        var receiver = void 0;
        if (typeof fn !== "function")  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        ASSERT(typeof fn === "function");
        var ret = new Array(values.length);
        var j = 0;
        if (receiver === void 0) {
             for (var i = 0, len = values.length; i < len; ++i) {
                var value = values[i];
                if (value === void 0 &&
                    !(i in values)) {
                    continue;
                }
                if (fn(value, i, len)) {
                    ret[j++] = value;
                }
            }
        }
        else {
            for (var i = 0, len = values.length; i < len; ++i) {
                var value = values[i];
                if (value === void 0 &&
                    !(i in values)) {
                    continue;
                }
                if (fn.call(receiver, value, i, len)) {
                    ret[j++] = value;
                }
            }
        }
        ret.length = j;
        return ret;
    }

    function Promise$_Filter(promises, fn, useBound, caller) {
        if (typeof fn !== "function") {
            return apiRejection(NOT_FUNCTION_ERROR);
        }

        if (useBound === USE_BOUND && promises._isBound()) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All(promises, PromiseArray, caller,
                useBound === USE_BOUND && promises._isBound()
                ? promises._boundTo
                : void 0)
            .promise()
            ._then(Promise$_filterer, void 0, void 0, fn, void 0, caller);
    }

    Promise.filter = function Promise$Filter(promises, fn) {
        return Promise$_Filter(promises, fn, DONT_USE_BOUND, Promise.filter);
    };

    Promise.prototype.filter = function Promise$filter(fn) {
        return Promise$_Filter(this, fn, USE_BOUND, this.filter);
    };
};
