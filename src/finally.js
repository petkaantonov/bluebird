"use strict";
module.exports = function(Promise, NEXT_FILTER) {
    var util = require("./util.js");
    var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;
    var isPrimitive = util.isPrimitive;
    var thrower = util.thrower;


    function returnThis() {
        return this;
    }
    function throwThis() {
        throw this;
    }
    function makeReturner(r) {
        return function Promise$_returner() {
            return r;
        };
    }
    function makeThrower(r) {
        return function Promise$_thrower() {
            throw r;
        };
    }
    function promisedFinally(ret, reasonOrValue, isFulfilled) {
        var useConstantFunction =
                        wrapsPrimitiveReceiver && isPrimitive(reasonOrValue);

        if (isFulfilled) {
            return ret._then(
                useConstantFunction
                    ? returnThis
                    : makeReturner(reasonOrValue),
                thrower, void 0, reasonOrValue, void 0, promisedFinally);
        }
        else {
            return ret._then(
                useConstantFunction
                    ? throwThis
                    : makeThrower(reasonOrValue),
                thrower, void 0, reasonOrValue, void 0, promisedFinally);
        }
    }

    function finallyHandler(reasonOrValue) {
        var promise = this.promise;
        var handler = this.handler;

        var ret = promise._isBound()
                        ? handler.call(promise._boundTo)
                        : handler();

        //Nobody ever returns anything from a .finally handler so speed this up
        if (ret !== void 0) {
            var maybePromise = Promise._cast(ret, finallyHandler, void 0);
            if (maybePromise instanceof Promise) {
                return promisedFinally(maybePromise, reasonOrValue,
                                        promise.isFulfilled());
            }
        }

        //Check if finallyHandler was called as a reject handler...
        if (promise.isRejected()) {
            NEXT_FILTER.e = reasonOrValue;
            return NEXT_FILTER;
        }
        //or success handler
        else {
            return reasonOrValue;
        }
    }

    function tapHandler(value) {
        var promise = this.promise;
        var handler = this.handler;

        var ret = promise._isBound()
                        ? handler.call(promise._boundTo, value)
                        : handler(value);

        //Nobody ever returns anything from a .finally handler so speed this up
        if (ret !== void 0) {
            var maybePromise = Promise._cast(ret, tapHandler, void 0);
            if (maybePromise instanceof Promise) {
                return promisedFinally(maybePromise, value, true);
            }
        }
        return value;
    }

    Promise.prototype._passThroughHandler =
    function Promise$_passThroughHandler(handler, isFinally, caller) {
        if (typeof handler !== "function") return this.then();

        var promiseAndHandler = {
            promise: this,
            handler: handler
        };

        return this._then(
                isFinally ? finallyHandler : tapHandler,
                isFinally ? finallyHandler : void 0, void 0,
                promiseAndHandler, void 0, caller);
    };

    Promise.prototype.lastly =
    Promise.prototype["finally"] = function Promise$finally(handler) {
        return this._passThroughHandler(handler, true, this.lastly);
    };

    Promise.prototype.tap = function Promise$tap(handler) {
        return this._passThroughHandler(handler, false, this.tap);
    };
};
