"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var ASSERT = require("./assert.js");
var async = require("./async.js");
var util = require("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    // `false` = initialValue provided as `accum` argument
    // `true` = treat the 0th value as initialValue
    this._zerothIsAccum = (accum === undefined);
    // `true` = we've received our initialValue
    this._gotAccum = false;
    // index of the value we are in the process of reducing
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    // Array is established once we have a known length
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    this._callback = fn;
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, RESOLVE_CALL_METHOD);
}
util.inherits(ReductionPromiseArray, PromiseArray);

// Override
ReductionPromiseArray.prototype._init = function () {};

// Override
ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    // we may resolve
    // once we've received our initialValue,
    // or if it's the 0th value (and we don't need to wait)
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

// Override
ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    ASSERT(!this._isResolved());
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = REDUCE_PHASE_MISSING;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    // Special case detection where the processing starts at index 1
    // because no initialValue was given
    if (index === 0 && this._zerothIsAccum) {
        ASSERT(!gotAccum);
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === REDUCE_PHASE_MISSING)
            ? REDUCE_PHASE_INITIAL : REDUCE_PHASE_REDUCED);
    // the initialValue was a promise and was fulfilled
    } else if (index === -1) {
        ASSERT(!gotAccum);
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === REDUCE_PHASE_MISSING) {
            valuesPhase[index] = REDUCE_PHASE_INITIAL;
        } else {
            ASSERT(gotAccum);
            valuesPhase[index] = REDUCE_PHASE_REDUCED;
            this._accum = value;
        }
    }
    // no point in reducing anything until we have an initialValue
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundTo;
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === REDUCE_PHASE_REDUCED) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== REDUCE_PHASE_INITIAL) return;
        value = values[i];
        ASSERT(!(value instanceof Promise));
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) {
            var e = errorObj.e;
            errorObj.e = null;
            return this._reject(e);
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            // Callback returned a pending
            // promise so continue iteration when it fulfills
            if (maybePromise._isPending()) {
                valuesPhase[i] = REDUCE_PHASE_REDUCING;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    // end-game, once everything has been resolved
    ASSERT(this._reducingIndex === length);
    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};
