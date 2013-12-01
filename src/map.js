"use strict";
module.exports = function(Promise, Promise$_All, PromiseArray, apiRejection) {

    var ASSERT = require("./assert.js");

    function Promise$_mapper(values) {
        var fn = this;
        var receiver = void 0;

        if (typeof fn !== "function")  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        ASSERT(typeof fn === "function");
        var shouldDefer = false;

        if (receiver === void 0) {
            for (var i = 0, len = values.length; i < len; ++i) {
                if (values[i] === void 0 &&
                    !(i in values)) {
                    continue;
                }
                var value = fn(values[i], i, len);
                if (!shouldDefer && Promise.is(value)) {
                    if (value.isFulfilled()) {
                        values[i] = value._settledValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                values[i] = value;
            }
        }
        else {
            for (var i = 0, len = values.length; i < len; ++i) {
                if (values[i] === void 0 &&
                    !(i in values)) {
                    continue;
                }
                var value = fn.call(receiver, values[i], i, len);
                if (!shouldDefer && Promise.is(value)) {
                    if (value.isFulfilled()) {
                        values[i] = value._settledValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                values[i] = value;
            }
        }
        return shouldDefer
            ? Promise$_All(values, PromiseArray,
                Promise$_mapper, void 0).promise()
            : values;
    }

    function Promise$_Map(promises, fn, useBound, caller) {
        if (typeof fn !== "function") {
            return apiRejection("fn is not a function");
        }

        if (useBound === USE_BOUND && promises._isBound()) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All(
            promises,
            PromiseArray,
            caller,
            useBound === USE_BOUND && promises._isBound()
                ? promises._boundTo
                : void 0
       ).promise()
        ._then(
            Promise$_mapper,
            void 0,
            void 0,
            fn,
            void 0,
            caller
       );
    }

    Promise.prototype.map = function Promise$map(fn) {
        return Promise$_Map(this, fn, USE_BOUND, this.map);
    };

    Promise.map = function Promise$Map(promises, fn) {
        return Promise$_Map(promises, fn, DONT_USE_BOUND, Promise.map);
    };
};
