"use strict";
module.exports = function (Promise, apiRejection) {
    var TypeError = require("./errors.js").TypeError;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                // Cheaper than throwing
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection.value();
        }
        return inspections;
    }

    function tryDispose(obj, methodName) {
        try {
            obj[methodName]();
            return true;
        }
        catch (e) {
            errorRef.e = e;
            return false;
        }
    }

    var errorRef = {e: null};
    function dispose(resources) {
        var haveError = false;
        var error = null;
        for (var i = 0; i < resources.length; ++i) {
            var maybePromise = Promise._cast(resources[i]);
            if (maybePromise instanceof Promise &&
                maybePromise.isFulfilled() &&
                maybePromise._isDisposable()) {
                if (!tryDispose(maybePromise.value(),
                                maybePromise._disposeMethodName) &&
                    !haveError) {
                    haveError = true;
                    error = errorRef.e;
                }
            }
        }

        // Override return value / return Promise.reject
        if (haveError) {
            throw error;
        }

    }

    function disposerSuccess(value) {
        dispose(this);
        return value;
    }

    function disposerFail(reason) {
        dispose(this);
        return Promise.reject(reason);
    }

    function using(resource, $fn) {
        var len = arguments.length;
        if (len < 2) return apiRejection(NOT_FUNCTION_ERROR);
        var resources = INLINE_SLICE(args, arguments, 0, len - 1);
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);

        return Promise.settle(resources)
            .then(inspectionMapper)
            .spread(fn)
            ._then(disposerSuccess, disposerFail, void 0,
                    resources, void 0, using);
    }

    Promise.prototype._setDisposable =
    function Promise$_setDisposable(methodName) {
        this._bitField = this._bitField | IS_DISPOSABLE;
        this._disposeMethodName = methodName;
    };

    Promise.prototype._isDisposable = function Promise$_isDisposable() {
        return (this._bitField & IS_DISPOSABLE) > 0;
    };

    Promise.prototype.disposer = function Promise$disposer(methodName) {
        if (typeof methodName !== "string") throw new TypeError();
        this._setDisposable(methodName);
        return this;
    };

};
