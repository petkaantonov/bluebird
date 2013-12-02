module.exports = function(Promise, NEXT_FILTER) {
    var util = require("./util.js");
    var ensureNotHandled = require("./errors.js").ensureNotHandled;
    var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;
    var isPrimitive = util.isPrimitive;
    var thrower = util.thrower;


    function returnThis() {
        return this;
    }
    function throwThis() {
        ensureNotHandled(this);
        throw this;
    }
    function makeReturner(r) {
        return function Promise$_returner() {
            return r;
        };
    }
    function makeThrower(r) {
        return function Promise$_thrower() {
            ensureNotHandled(r);
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
            if (Promise.is(maybePromise)) {
                return promisedFinally(maybePromise, reasonOrValue,
                                        promise.isFulfilled());
            }
        }

        //Check if finallyHandler was called as a reject handler...
        if (promise.isRejected()) {
            ensureNotHandled(reasonOrValue);
            NEXT_FILTER.e = reasonOrValue;
            return NEXT_FILTER;
        }
        //or success handler
        else {
            return reasonOrValue;
        }
    }

    Promise.prototype.lastly = Promise.prototype["finally"] =
    function Promise$finally(handler) {
        if (typeof handler !== "function") return this.then();

        var promiseAndHandler = {
            promise: this,
            handler: handler
        };

        return this._then(finallyHandler, finallyHandler, void 0,
                promiseAndHandler, void 0, this.lastly);
    };
};
