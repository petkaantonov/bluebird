"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError(CIRCULAR_RESOLUTION_ERROR);
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var ASSERT = require("./assert.js");
var util = require("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var UNDEFINED_BINDING = {};
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
var NEXT_FILTER = {e: null};
var tryConvertToPromise = require("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    require("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = require("./captured_trace.js")();
var isDebugging = require("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    require("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = require("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = require("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError(CONSTRUCT_ERROR_ARG);
    }
    if (this.constructor !== Promise) {
        throw new TypeError(CONSTRUCT_ERROR_INVOCATION);
    }
    //see constants.js for layout
    this._bitField = NO_STATE;
    //Since most promises have exactly 1 parallel handler
    //store the first ones directly on the object
    //The rest (if needed) are stored on the object's
    //elements array (this[0], this[1]...etc)
    //which has less indirection than when using external array
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    //reason for rejection or fulfilled value
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
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
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError(NOT_ERROR_TYPE_OR_PREDICATE));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
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
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
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
    if (typeof fn !== "function") throw new TypeError(NOT_FUNCTION_ERROR);
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    ASSERT(arguments.length === 5);
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, PROPAGATE_BIND | PROPAGATE_CANCEL);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(this._isFulfilled() || this._isRejected());
    ASSERT(this._promiseAt(index) !== undefined);
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    ASSERT(arguments.length === 0);
    return this._bitField & LENGTH_MASK;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & IS_FOLLOWING_OR_REJECTED_OR_FULFILLED) > 0;
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

Promise.prototype._cancellable = function () {
    return (this._bitField & IS_CANCELLABLE) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | IS_CANCELLABLE;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~IS_CANCELLABLE);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | IS_MIGRATED;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~IS_MIGRATED);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & IS_MIGRATED) > 0;
};

Promise.prototype._receiverAt = function (index) {
    ASSERT(!this._isFollowing());
    var ret = index === 0
        ? this._receiver0
        : this[
            index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET];
    //Only use the bound value when not calling internal methods
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    ASSERT(!this._isFollowing());
    return index === 0
        ? this._promise0
        : this[index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    ASSERT(!this._isFollowing());
    ASSERT(!this._isCarryingStackTrace());
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    ASSERT(!this._isFollowing());
    return index === 0
        ? this._rejectionHandler0
        : this[index * CALLBACK_SIZE - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            ASSERT(!ret.isPending());
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    ASSERT(typeof domain === "object");
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
        ASSERT(this._progressHandler0 === undefined);

        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        ASSERT(this[base + CALLBACK_PROMISE_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_RECEIVER_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_FULFILL_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_REJECT_OFFSET] === undefined);
        ASSERT(this[base + CALLBACK_PROGRESS_OFFSET] === undefined);
        var base = index * CALLBACK_SIZE - CALLBACK_SIZE;
        this[base + CALLBACK_PROMISE_OFFSET] = promise;
        this[base + CALLBACK_RECEIVER_OFFSET] = receiver;
        if (typeof fulfill === "function") {
            this[base + CALLBACK_FULFILL_OFFSET] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + CALLBACK_REJECT_OFFSET] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + CALLBACK_PROGRESS_OFFSET] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    ASSERT(!this._isFollowing());
    var index = this._length();

    if (index >= MAX_LENGTH - CALLBACK_SIZE) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * CALLBACK_SIZE - CALLBACK_SIZE;
        this[base + CALLBACK_PROMISE_OFFSET] = promiseSlotValue;
        this[base + CALLBACK_RECEIVER_OFFSET] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    ASSERT(!this._isFollowing());
    ASSERT(!this._isResolved());
    ASSERT(arguments.length === 2);
    ASSERT(typeof index === "number");
    ASSERT((index | 0) === index);
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = PROPAGATE_CANCEL | (shouldBind ? PROPAGATE_BIND : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
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

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    ASSERT(!promise._isFollowingOrFulfilledOrRejected());
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
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

Promise.prototype._cleanValues = function () {
    ASSERT(!this._isFollowing());
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & PROPAGATE_CANCEL) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & PROPAGATE_BIND) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
    ASSERT((flags & PROPAGATE_TRACE) === 0);
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    ASSERT(!this._isFollowing());
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    ASSERT(this._isFulfilled() || this._isRejected());

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        //if promise is not instanceof Promise
        //it is internally smuggled data
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    // Heuristic for promises that are stashed away somewhere
    // and might accumulate large index over time
    // The modulus is so that invokeLater is not called every time index
    // is over 4, but every 32nd time
    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    ASSERT(!this._isFollowing());
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * CALLBACK_SIZE - CALLBACK_SIZE;
        this[base + CALLBACK_PROMISE_OFFSET] =
        this[base + CALLBACK_RECEIVER_OFFSET] =
        this[base + CALLBACK_FULFILL_OFFSET] =
        this[base + CALLBACK_REJECT_OFFSET] =
        this[base + CALLBACK_PROGRESS_OFFSET] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            IS_SETTLE_PROMISES_QUEUED) === IS_SETTLE_PROMISES_QUEUED;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | IS_SETTLE_PROMISES_QUEUED;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~IS_SETTLE_PROMISES_QUEUED);
};

Promise.prototype._queueSettlePromises = function() {
    ASSERT(!this._isFollowing());
    ASSERT(!this._isSettlePromisesQueued());
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    ASSERT(!this._isFollowingOrFulfilledOrRejected());
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    ASSERT(!this._isFollowingOrFulfilledOrRejected());
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
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

require("./progress.js")(Promise, PromiseArray);
require("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
require("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
require("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
require("./direct_resolve.js")(Promise);
require("./synchronous_inspection.js")(Promise);
require("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
};
