"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var ASSERT = require("./assert");
var util = require("./util");
var isArray = util.isArray;

//To avoid eagerly allocating the objects
//and also because undefined cannot be smuggled
function toResolutionValue(val) {
    switch(val) {
    case RESOLVE_ARRAY: return [];
    case RESOLVE_OBJECT: return {};
    }
    ASSERT(false);
}

function PromiseArray(values) {
    ASSERT(arguments.length === 1);
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, PROPAGATE_ALL);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, RESOLVE_ARRAY);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        USE(bitField);
        this._values = values;

        if (BIT_FIELD_CHECK(IS_PENDING_AND_WAITING_NEG)) {
            ASSERT(typeof resolveValueIfEmpty === "number");
            ASSERT(resolveValueIfEmpty < 0);
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (BIT_FIELD_CHECK(IS_FULFILLED)) {
            values = values._value();
        } else if (BIT_FIELD_CHECK(IS_REJECTED)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            COLLECTION_ERROR + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === RESOLVE_CALL_METHOD) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (BIT_FIELD_CHECK(IS_PENDING_AND_WAITING_NEG)) {
                // Optimized for just passing the updates through
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (BIT_FIELD_CHECK(IS_FULFILLED)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (BIT_FIELD_CHECK(IS_REJECTED)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
        ASSERT(typeof isResolved === "boolean");
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    ASSERT(!this._isResolved());
    ASSERT(!(value instanceof Promise));
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise.isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    ASSERT(!this._isResolved());
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    ASSERT(!this._isResolved());
    ASSERT(isArray(this._values));
    ASSERT(typeof index === "number");
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    ASSERT(!this._isResolved());
    ASSERT(isArray(this._values));
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};
