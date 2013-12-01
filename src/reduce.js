"use strict";
module.exports = function(Promise, Promise$_All, PromiseArray, apiRejection) {

    var ASSERT = require("./assert.js");

    function Promise$_reducer(fulfilleds, initialValue) {
        var fn = this;
        var receiver = void 0;
        if (typeof fn !== "function")  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        ASSERT(typeof fn === "function");
        var len = fulfilleds.length;
        var accum = void 0;
        var startIndex = 0;

        if (initialValue !== void 0) {
            accum = initialValue;
            startIndex = 0;
        }
        else {
            startIndex = 1;
            if (len > 0) {
                for (var i = 0; i < len; ++i) {
                    if (fulfilleds[i] === void 0 &&
                        !(i in fulfilleds)) {
                        continue;
                    }
                    accum = fulfilleds[i];
                    startIndex = i + 1;
                    break;
                }
            }
        }
        if (receiver === void 0) {
            for (var i = startIndex; i < len; ++i) {
                if (fulfilleds[i] === void 0 &&
                    !(i in fulfilleds)) {
                    continue;
                }
                accum = fn(accum, fulfilleds[i], i, len);
            }
        }
        else {
            for (var i = startIndex; i < len; ++i) {
                if (fulfilleds[i] === void 0 &&
                    !(i in fulfilleds)) {
                    continue;
                }
                accum = fn.call(receiver, accum, fulfilleds[i], i, len);
            }
        }
        return accum;
    }

    function Promise$_unpackReducer(fulfilleds) {
        var fn = this.fn;
        var initialValue = this.initialValue;
        return Promise$_reducer.call(fn, fulfilleds, initialValue);
    }

    function Promise$_slowReduce(
        promises, fn, initialValue, useBound, caller) {
        return initialValue._then(function callee(initialValue) {
            return Promise$_Reduce(
                promises, fn, initialValue, useBound, callee);
        }, void 0, void 0, void 0, void 0, caller);
    }

    function Promise$_Reduce(promises, fn, initialValue, useBound, caller) {
        if (typeof fn !== "function") {
            return apiRejection("fn is not a function");
        }

        if (useBound === USE_BOUND && promises._isBound()) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        if (initialValue !== void 0) {
            if (Promise.is(initialValue)) {
                if (initialValue.isFulfilled()) {
                    initialValue = initialValue._settledValue;
                }
                else {
                    return Promise$_slowReduce(promises,
                        fn, initialValue, useBound, caller);
                }
            }

            return Promise$_All(promises, PromiseArray, caller,
                useBound === USE_BOUND && promises._isBound()
                    ? promises._boundTo
                    : void 0)
                .promise()
                ._then(Promise$_unpackReducer, void 0, void 0, {
                    fn: fn,
                    initialValue: initialValue
                }, void 0, Promise.reduce);
        }
        return Promise$_All(promises, PromiseArray, caller,
                useBound === USE_BOUND && promises._isBound()
                    ? promises._boundTo
                    : void 0).promise()
            //Currently smuggling internal data has a limitation
            //in that no promises can be chained after it.
            //One needs to be able to chain to get at
            //the reduced results, so fast case is only possible
            //when there is no initialValue.
            ._then(Promise$_reducer, void 0, void 0, fn, void 0, caller);
    }


    Promise.reduce = function Promise$Reduce(promises, fn, initialValue) {
        return Promise$_Reduce(promises, fn,
            initialValue, DONT_USE_BOUND, Promise.reduce);
    };

    Promise.prototype.reduce = function Promise$reduce(fn, initialValue) {
        return Promise$_Reduce(this, fn, initialValue,
                                USE_BOUND, this.reduce);
    };
};
