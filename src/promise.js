"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError(CIRCULAR_RESOLUTION_ERROR);
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
var ASSERT = require("./assert.js");
var util = require("./util.js");
var async = require("./async.js");
var errors = require("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = require("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    require("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var debug = require("./debuggability.js")(Promise);
var CapturedTrace = debug.CapturedTrace;
var finallyHandler = require("./finally.js")(Promise, tryConvertToPromise);
 /*jshint unused:false*/
var createContext =
    require("./context.js")(Promise, CapturedTrace, debug.longStackTraces);
var catchFilter = require("./catch_filter.js")(NEXT_FILTER);
var nodebackForPromise = require("./nodeback.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError(FUNCTION_ERROR + util.classString(resolver));
    }
    if (self.constructor !== Promise) {
        throw new TypeError(CONSTRUCT_ERROR_INVOCATION);
    }
}
function Promise(resolver) {
    this._bitField = NO_STATE;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) {
        check(this, resolver);
        this._resolveFromResolver(resolver);
    }
    var ctx;
    if ((ctx = this._peekContext()) !== undefined) ctx._promisesCreated++;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection(OBJECT_ERROR + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection(FUNCTION_ERROR + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn, multiArgs) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret, !!multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError(FUNCTION_ERROR + util.classString(fn));
    }
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _, // For fast-cast compatibility between bluebird versions
    receiver,
    internalData
) {
    ASSERT(arguments.length === 5);
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        promise._propagateFrom(this, PROPAGATE_ALL);
        promise._captureStackTrace();
        if (receiver === undefined) receiver = this._boundTo;
    }

    var target = this._target();
    var bitField = target._bitField;
    if (!BIT_FIELD_CHECK(IS_PENDING_AND_WAITING_NEG)) {
        var handler;
        if (BIT_FIELD_CHECK(IS_REJECTED_OR_CANCELLED)) {
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            handler = didFulfill;
        }
        async.invoke(target._settlePromiseCtx, target, {
            handler: handler,
            promise: promise,
            receiver: receiver
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver);
    }

    return promise;
};

Promise.prototype._length = function () {
    ASSERT(arguments.length === 0);
    return this._bitField & LENGTH_MASK;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & IS_FATE_SEALED) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & IS_FOLLOWING) === IS_FOLLOWING;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & LENGTH_CLEAR_MASK) |
        (len & LENGTH_MASK);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | IS_FULFILLED;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | IS_REJECTED;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | IS_FOLLOWING;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | IS_FINAL;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & IS_FINAL) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~IS_CANCELLED);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | IS_CANCELLED;
};

Promise.prototype._receiverAt = function (index) {
    ASSERT(index > 0);
    ASSERT(!this._isFollowing());
    var ret = this[
            index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET];
    //Only use the bound value when not calling internal methods
    if (ret === undefined && this._isBound()) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    ASSERT(index > 0);
    ASSERT(!this._isFollowing());
    return this[
            index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    ASSERT(!this._isFollowing());
    ASSERT(index > 0);
    return this[
            index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    ASSERT(!this._isFollowing());
    ASSERT(index > 0);
    return this[
            index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET];
};

Promise.prototype._migrateCallback0 = function (follower) {
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiver0;
    if (receiver === undefined) receiver = follower._boundTo;
    this._addCallbacks(fulfill, reject, promise, receiver);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    ASSERT(index > 0);
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    this._addCallbacks(fulfill, reject, promise, receiver);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver
) {
    ASSERT(!this._isFateSealed());
    ASSERT(!this._isFollowing());
    var index = this._length();

    if (index >= MAX_LENGTH - CALLBACK_SIZE) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        ASSERT(this._promise0 === undefined);
        ASSERT(this._receiver0 === undefined);
        ASSERT(this._fulfillmentHandler0 === undefined ||
            this._isCarryingStackTrace());
        ASSERT(this._rejectionHandler0 === undefined);

        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace())
            this._fulfillmentHandler0 = fulfill;
        if (typeof reject === "function") this._rejectionHandler0 = reject;
    } else {
        ASSERT(this[base + CALLBACK_PROMISE_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_RECEIVER_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_FULFILL_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_REJECT_OFFSET] === undefined);
        var base = index * CALLBACK_SIZE - CALLBACK_SIZE;
        this[base + CALLBACK_PROMISE_OFFSET] = promise;
        this[base + CALLBACK_RECEIVER_OFFSET] = receiver;
        if (typeof fulfill === "function")
            this[base + CALLBACK_FULFILL_OFFSET] = fulfill;
        if (typeof reject === "function")
            this[base + CALLBACK_REJECT_OFFSET] = reject;
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    ASSERT(!this._isFollowing());
    ASSERT(arguments.length === 2);
    ASSERT(typeof index === "number");
    ASSERT((index | 0) === index);
    this._addCallbacks(undefined, undefined, index, promiseArray);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (BIT_FIELD_CHECK(IS_FATE_SEALED, this._bitField)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, PROPAGATE_BIND);

    var promise = maybePromise._target();
    var bitField = promise._bitField;
    if (BIT_FIELD_CHECK(IS_PENDING_AND_WAITING_NEG)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
        if (this._onCancel() !== undefined) {
            promise._attachCancellationCallback(this._onCancel(), this);
            this._unsetOnCancel();
        }
    } else if (BIT_FIELD_CHECK(IS_FULFILLED)) {
        this._fulfillUnchecked(promise._value());
    } else if (BIT_FIELD_CHECK(IS_REJECTED)) {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    } else {
        this._cancel();
    }
};

Promise.prototype._rejectCallback = function(reason, synchronous) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    ASSERT(typeof resolver === "function");
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        if (r === errorObj && promise !== null) {
            promise._rejectCallback(r.e, true);
            promise = null;
        }
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (BIT_FIELD_CHECK(IS_REJECTED_OR_CANCELLED)) {
        if (BIT_FIELD_CHECK(IS_REJECTED)) return;
        promise._unsetCancelled();
    }
    ASSERT(!promise._isFateSealed());
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundTo, value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promisesCreatedDuringHandlerInvocation = promise._popContext();

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj || x === promise) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false);
    } else {
        if (x === undefined &&
            promisesCreatedDuringHandlerInvocation > 0 &&
            debug.longStackTraces() &&
            debug.warnings()) {
            promise._warn("a promise was created in a handler but " +
                "none were returned from it", true);
        }
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    ASSERT(this._isFollowing());
    ASSERT(this._rejectionHandler0 instanceof Promise);
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    ASSERT(this._isFollowing());
    ASSERT(!(this._rejectionHandler0 instanceof Promise));
    this._rejectionHandler0 = promise;
};

Promise.prototype._fulfill = function (value) {
    if (this._isFateSealed()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFateSealed()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromise = function(promise, handler, receiver) {
    ASSERT(!this._isFollowing());
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var value = this._settledValue;
    if (BIT_FIELD_CHECK(IS_CANCELLED)) {
        if (isPromise && promise.isCancellable()
            && promise._onCancel() !== undefined) {
            promise._invokeOnCancel(promise._onCancel());
        }
        if (handler === finallyHandler) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (receiver instanceof PromiseArray) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        //if promise is not instanceof Promise
        //it is internally smuggled data
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (BIT_FIELD_CHECK(IS_FULFILLED)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (BIT_FIELD_CHECK(IS_FULFILLED)) {
            promise._fulfill(value);
        } else {
            promise._reject(value, this._isCarryingStackTrace()
                                ? this._getCarriedStackTrace()
                                : undefined);
        }
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver);
};

Promise.prototype._settlePromise0 = function(handler, bitField) {
    var promise = this._promise0;
    var receiver = this._receiver0;
    if (receiver === undefined) {
        if (BIT_FIELD_CHECK(IS_BOUND)) receiver = this._boundTo;
    } else {
        // Only clear if necessary
        this._receiver0 = undefined;
    }
    // fulfillmentHandler0 is cleared in settlePromises
    this._rejectionHandler0 = this._promise0 = undefined;
    this._settlePromise(promise, handler, receiver);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    ASSERT(!this._isFollowing());
    ASSERT(index > 0);
    var base = index * CALLBACK_SIZE - CALLBACK_SIZE;
    this[base + CALLBACK_PROMISE_OFFSET] =
    this[base + CALLBACK_RECEIVER_OFFSET] =
    this[base + CALLBACK_FULFILL_OFFSET] =
    this[base + CALLBACK_REJECT_OFFSET] = undefined;
};

Promise.prototype._fulfillUnchecked = function (value) {
    ASSERT(!this._isFateSealed());
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        async.settlePromises(this);
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    ASSERT(!this._isFateSealed());
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        ASSERT(this._length() === 0);
        return async.fatalError(reason, trace, util.isNode);
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver);
    }
};

Promise.prototype._rejectPromises = function (len) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = BIT_FIELD_READ(LENGTH_MASK);
    ASSERT(len >= 1);
    if (BIT_FIELD_CHECK(IS_REJECTED_OR_CANCELLED)) {
        this._settlePromise0(this._rejectionHandler0, bitField);
        if (!BIT_FIELD_CHECK(IS_CARRYING_STACK_TRACE)) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectPromises(len);
    } else {
        this._settlePromise0(this._fulfillmentHandler0, bitField);
        this._fulfillPromises(len);
    }
    this._setLength(0);
};

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};
Promise._async = async;
Promise._makeSelfResolutionError = makeSelfResolutionError;
require("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
require("./bind.js")(Promise, INTERNAL, tryConvertToPromise);

require("./direct_resolve.js")(Promise);
require("./synchronous_inspection.js")(Promise);
require("./join.js")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, debug);
Promise.Promise = Promise;
};
