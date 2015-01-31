"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var util = require("./util.js");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    this._fn = fn;
    this._initialValue = initialValue;
    this._eachValues = _each === INTERNAL ? [] : undefined;
    this._promise._captureStackTrace();
    this._init$(undefined, RESOLVE_CALL_METHOD);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    this._eachValues.push(value);
    return this._eachValues;
};

// Override
ReductionPromiseArray.prototype._init = function() {};

// Override
ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._initialValue === INTERNAL ? [] : this._initialValue);
};

// Override
ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

// Override
ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

// Override
ReductionPromiseArray.prototype._iterate = function (values) {
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = Promise.resolve(this._initialValue);
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    this._resolve(value);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundTo, value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundTo,
                              this.accum, value, this.index, this.length);
    }
    promise._popContext();
    return ret;
}
};
