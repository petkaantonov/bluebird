"use strict";
module.exports = function (Promise, apiRejection) {
    var TypeError = require("./errors.js").TypeError;
    var inherits = require("./util.js").inherits;
    var errorRef = {e: null};
    var PromiseInspection = Promise.PromiseInspection;

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

    function dispose(resources, inspection) {
        var haveError = false;
        var error = null;
        for (var i = 0; i < resources.length; ++i) {
            var maybePromise = Promise._cast(resources[i], void 0);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                if (!maybePromise._getDisposer().tryDispose(inspection) &&
                    !haveError) {
                    haveError = true;
                    error = errorRef.e;
                }
            }
        }

        // Override return value / return Promise.reject
        if (haveError) throw error;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = IS_FULFILLED;
        dispose(this, inspection);
        return value;
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = IS_REJECTED;
        dispose(this, inspection);
        return Promise.reject(reason);
    }

    function Disposer(data, promise) {
        this._data = data;
        this._promise = promise;
    }

    Disposer.prototype.data = function Disposer$data() {
        return this._data;
    };

    Disposer.prototype.promise = function Disposer$promise() {
        return this._promise;
    };

    Disposer.prototype.resource = function Disposer$resource() {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var ret = true;
        if (resource !== null) {
            try {
                this.doDispose(resource, inspection);
            }
            catch (e) {
                errorRef.e = e;
                ret = false;
            }
        }
        this._promise._unsetDisposable();
        this._data = this._promise = null;
        return ret;
    };

    function MethodNameDisposer(methodName, promise) {
        this.constructor$(methodName, promise);
    }
    inherits(MethodNameDisposer, Disposer);

    MethodNameDisposer.prototype.doDispose = function (resource, inspection) {
        var methodName = this.data();
        resource[methodName](inspection);
    };

    function FunctionDisposer(fn, promise) {
        this.constructor$(fn, promise);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        fn(resource, inspection);
    };

    Promise.using = function Promise$using() {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
        len--;
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = arguments[i];
            if (resource instanceof Disposer) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            }
            resources[i] = resource;
        }

        return Promise.settle(resources)
            .then(inspectionMapper)
            .spread(fn)
            ._then(disposerSuccess, disposerFail, void 0, resources, void 0);
    };

    Promise.prototype._setDisposable =
    function Promise$_setDisposable(disposer) {
        this._bitField = this._bitField | IS_DISPOSABLE;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function Promise$_isDisposable() {
        return (this._bitField & IS_DISPOSABLE) > 0;
    };

    Promise.prototype._getDisposer = function Promise$_getDisposer() {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function Promise$_unsetDisposable() {
        this._bitField = this._bitField & (~IS_DISPOSABLE);
        this._disposer = void 0;
    };

    Promise.prototype.disposer = function Promise$disposer(methodName) {
        if (typeof methodName === "string") {
            return new MethodNameDisposer(methodName, this);
        }
        else if (typeof methodName === "function") {
            return new FunctionDisposer(methodName, this);
        }
        throw new TypeError();
    };

};
