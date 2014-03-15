"use strict";
module.exports = function() {
var global = require("./global.js");
var ASSERT = require("./assert.js");
var util = require("./util.js");
var async = require("./async.js");
var errors = require("./errors.js");

var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};

var PromiseArray = require("./promise_array.js")(Promise, INTERNAL);
var CapturedTrace = require("./captured_trace.js")();
var CatchFilter = require("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = require("./promise_resolver.js");

var isArray = util.isArray;

var errorObj = util.errorObj;
var tryCatch1 = util.tryCatch1;
var tryCatch2 = util.tryCatch2;
var tryCatchApply = util.tryCatchApply;
var RangeError = errors.RangeError;
var TypeError = errors.TypeError;
var CancellationError = errors.CancellationError;
var TimeoutError = errors.TimeoutError;
var RejectionError = errors.RejectionError;
var originatesFromRejection = errors.originatesFromRejection;
var markAsOriginatingFromRejection = errors.markAsOriginatingFromRejection;
var canAttach = errors.canAttach;
var thrower = util.thrower;
var apiRejection = require("./errors_api_rejection")(Promise);


var makeSelfResolutionError = function Promise$_makeSelfResolutionError() {
    return new TypeError(CIRCULAR_RESOLUTION_ERROR);
};

function isPromise(obj) {
    if (obj === void 0) return false;
    return obj instanceof Promise;
}

function isPromiseArrayProxy(receiver, promiseSlotValue) {
    if (receiver instanceof PromiseArray) {
        ASSERT(typeof promiseSlotValue === "number");
        ASSERT((promiseSlotValue | 0) === promiseSlotValue);
        //Index into the array
        return promiseSlotValue >= 0;
    }
    return false;
}

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
    this._fulfillmentHandler0 = void 0;
    this._rejectionHandler0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    //reason for rejection or fulfilled value
    this._settledValue = void 0;
    //for .bind
    this._boundTo = void 0;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.bind = function Promise$bind(thisArg) {
    var ret = new Promise(INTERNAL);
    if (debugging) ret._setTrace(this.bind, this);
    ret._follow(this);
    ret._setBoundTo(thisArg);
    if (this._cancellable()) {
        ret._setCancellable();
        ret._cancellationParent = this;
    }
    return ret;
};

Promise.prototype.toString = function Promise$toString() {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] =
function Promise$catch(fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            }
            else {
                var catchFilterTypeError =
                    new TypeError(
                        "A catch filter must be an error constructor "
                        + "or a filter function");

                this._attachExtraTrace(catchFilterTypeError);
                async.invoke(this._reject, this, catchFilterTypeError);
                return;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];

        this._resetTrace(this.caught);
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught);
    }
    return this._then(void 0, fn, void 0, void 0, void 0, this.caught);
};

Promise.prototype.then =
function Promise$then(didFulfill, didReject, didProgress) {
    return this._then(didFulfill, didReject, didProgress,
        void 0, void 0, this.then);
};


Promise.prototype.done =
function Promise$done(didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        void 0, void 0, this.done);
    promise._setIsFinal();
};

Promise.prototype.spread = function Promise$spread(didFulfill, didReject) {
    return this._then(didFulfill, didReject, void 0,
        APPLY, void 0, this.spread);
};

Promise.prototype.isFulfilled = function Promise$isFulfilled() {
    return (this._bitField & IS_FULFILLED) > 0;
};


Promise.prototype.isRejected = function Promise$isRejected() {
    return (this._bitField & IS_REJECTED) > 0;
};

Promise.prototype.isPending = function Promise$isPending() {
    return !this.isResolved();
};


Promise.prototype.isResolved = function Promise$isResolved() {
    return (this._bitField & IS_REJECTED_OR_FULFILLED) > 0;
};


Promise.prototype.isCancellable = function Promise$isCancellable() {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function Promise$toJSON() {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: void 0,
        rejectionReason: void 0
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this._settledValue;
        ret.isFulfilled = true;
    }
    else if (this.isRejected()) {
        ret.rejectionReason = this._settledValue;
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function Promise$all() {
    return Promise$_all(this, USE_BOUND, this.all);
};


Promise.is = isPromise;

function Promise$_all(promises, useBound, caller) {
    return Promise$_CreatePromiseArray(
        promises,
        PromiseArray,
        caller,
        useBound === USE_BOUND && promises._isBound()
            ? promises._boundTo
            : void 0
   ).promise();
}
Promise.all = function Promise$All(promises) {
    return Promise$_all(promises, DONT_USE_BOUND, Promise.all);
};

Promise.join = function Promise$Join() {
    INLINE_SLICE(args, arguments);
    return Promise$_CreatePromiseArray(
        args, PromiseArray, Promise.join, void 0).promise();
};

Promise.resolve = Promise.fulfilled =
function Promise$Resolve(value, caller) {
    var ret = new Promise(INTERNAL);
    if (debugging) ret._setTrace(typeof caller === "function"
        ? caller
        : Promise.resolve, void 0);
    if (ret._tryFollow(value)) {
        return ret;
    }
    ret._cleanValues();
    ret._setFulfilled();
    ret._settledValue = value;
    return ret;
};

Promise.reject = Promise.rejected = function Promise$Reject(reason) {
    var ret = new Promise(INTERNAL);
    if (debugging) ret._setTrace(Promise.reject, void 0);
    markAsOriginatingFromRejection(reason);
    ret._cleanValues();
    ret._setRejected();
    ret._settledValue = reason;
    if (!canAttach(reason)) {
        var trace = new Error(reason + "");
        ret._setCarriedStackTrace(trace);
    }
    ret._ensurePossibleRejectionHandled();
    return ret;
};

Promise.prototype.error = function Promise$_error(fn) {
    return this.caught(originatesFromRejection, fn);
};

Promise.prototype._resolveFromSyncValue =
function Promise$_resolveFromSyncValue(value, caller) {
    if (value === errorObj) {
        this._cleanValues();
        this._setRejected();
        this._settledValue = value.e;
        this._ensurePossibleRejectionHandled();
    }
    else {
        var maybePromise = Promise._cast(value, caller, void 0);
        if (maybePromise instanceof Promise) {
            this._follow(maybePromise);
        }
        else {
            this._cleanValues();
            this._setFulfilled();
            this._settledValue = value;
        }
    }
};

Promise.method = function Promise$_Method(fn) {
    if (typeof fn !== "function") {
        throw new TypeError(NOT_FUNCTION_ERROR);
    }
    return function Promise$_method() {
        var value;
        switch(arguments.length) {
        case 0: value = tryCatch1(fn, this, void 0); break;
        case 1: value = tryCatch1(fn, this, arguments[0]); break;
        case 2: value = tryCatch2(fn, this, arguments[0], arguments[1]); break;
        default:
            INLINE_SLICE(args, arguments);
            value = tryCatchApply(fn, args, this); break;
        }
        var ret = new Promise(INTERNAL);
        if (debugging) ret._setTrace(Promise$_method, void 0);
        ret._resolveFromSyncValue(value, Promise$_method);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function Promise$_Try(fn, args, ctx) {

    if (typeof fn !== "function") {
        return apiRejection(NOT_FUNCTION_ERROR);
    }
    var value = isArray(args)
        ? tryCatchApply(fn, args, ctx)
        : tryCatch1(fn, ctx, args);

    var ret = new Promise(INTERNAL);
    if (debugging) ret._setTrace(Promise.attempt, void 0);
    ret._resolveFromSyncValue(value, Promise.attempt);
    return ret;
};

Promise.defer = Promise.pending = function Promise$Defer(caller) {
    var promise = new Promise(INTERNAL);
    if (debugging) promise._setTrace(typeof caller === "function"
                              ? caller : Promise.defer, void 0);
    return new PromiseResolver(promise);
};

Promise.bind = function Promise$Bind(thisArg) {
    var ret = new Promise(INTERNAL);
    if (debugging) ret._setTrace(Promise.bind, void 0);
    ret._setFulfilled();
    ret._setBoundTo(thisArg);
    return ret;
};

Promise.cast = function Promise$_Cast(obj, caller) {
    if (typeof caller !== "function") {
        caller = Promise.cast;
    }
    var ret = Promise._cast(obj, caller, void 0);
    if (!(ret instanceof Promise)) {
        return Promise.resolve(ret, caller);
    }
    return ret;
};

Promise.onPossiblyUnhandledRejection =
function Promise$OnPossiblyUnhandledRejection(fn) {
    if (typeof fn === "function") {
        CapturedTrace.possiblyUnhandledRejection = fn;
    }
    else {
        CapturedTrace.possiblyUnhandledRejection = void 0;
    }
};

var debugging = __DEBUG__ || !!(
    typeof process !== "undefined" &&
    typeof process.execPath === "string" &&
    typeof process.env === "object" &&
    (process.env["BLUEBIRD_DEBUG"] ||
        process.env["NODE_ENV"] === "development")
);


Promise.longStackTraces = function Promise$LongStackTraces() {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error(LONG_STACK_TRACES_ERROR);
    }
    debugging = CapturedTrace.isSupported();
};

Promise.hasLongStackTraces = function Promise$HasLongStackTraces() {
    return debugging && CapturedTrace.isSupported();
};

Promise.prototype._setProxyHandlers =
function Promise$_setProxyHandlers(receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= MAX_LENGTH - CALLBACK_SIZE) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    }
    else {
        var i = index - CALLBACK_SIZE;
        this[i + CALLBACK_PROMISE_OFFSET] = promiseSlotValue;
        this[i + CALLBACK_RECEIVER_OFFSET] = receiver;
        this[i + CALLBACK_FULFILL_OFFSET] =
        this[i + CALLBACK_REJECT_OFFSET] =
        this[i + CALLBACK_PROGRESS_OFFSET] = void 0;
    }
    this._setLength(index + CALLBACK_SIZE);
};

Promise.prototype._proxyPromiseArray =
function Promise$_proxyPromiseArray(promiseArray, index) {
    ASSERT(!this.isResolved());
    ASSERT(arguments.length === 2);
    ASSERT(typeof index === "number");
    ASSERT((index | 0) === index);
    ASSERT(index >= 0);
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._proxyPromise = function Promise$_proxyPromise(promise) {
    ASSERT(!promise._isProxied());
    ASSERT(!this.isResolved());
    ASSERT(arguments.length === 1);
    promise._setProxied();
    this._setProxyHandlers(promise, -1);
};

Promise.prototype._then =
function Promise$_then(
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData,
    caller
) {
    ASSERT(arguments.length === 6);
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (debugging && !haveInternalData) {
        var haveSameContext = this._peekContext() === this._traceParent;
        ret._traceParent = haveSameContext ? this._traceParent : this;
        ret._setTrace(typeof caller === "function"
                ? caller
                : this._then, this);
    }

    if (!haveInternalData && this._isBound()) {
        ret._setBoundTo(this._boundTo);
    }

    var callbackIndex =
        this._addCallbacks(didFulfill, didReject, didProgress, ret, receiver);

    if (!haveInternalData && this._cancellable()) {
        ret._setCancellable();
        ret._cancellationParent = this;
    }

    if (this.isResolved()) {
        async.invoke(this._queueSettleAt, this, callbackIndex);
    }

    return ret;
};

Promise.prototype._length = function Promise$_length() {
    ASSERT(isPromise(this));
    ASSERT(arguments.length === 0);
    return this._bitField & LENGTH_MASK;
};

Promise.prototype._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return (this._bitField & IS_FOLLOWING_OR_REJECTED_OR_FULFILLED) > 0;
};

Promise.prototype._isFollowing = function Promise$_isFollowing() {
    return (this._bitField & IS_FOLLOWING) === IS_FOLLOWING;
};

Promise.prototype._setLength = function Promise$_setLength(len) {
    this._bitField = (this._bitField & LENGTH_CLEAR_MASK) |
        (len & LENGTH_MASK);
};

Promise.prototype._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | IS_FULFILLED;
};

Promise.prototype._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | IS_REJECTED;
};

Promise.prototype._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | IS_FOLLOWING;
};

Promise.prototype._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | IS_FINAL;
};

Promise.prototype._isFinal = function Promise$_isFinal() {
    return (this._bitField & IS_FINAL) > 0;
};

Promise.prototype._cancellable = function Promise$_cancellable() {
    return (this._bitField & IS_CANCELLABLE) > 0;
};

Promise.prototype._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | IS_CANCELLABLE;
};

Promise.prototype._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & (~IS_CANCELLABLE);
};

Promise.prototype._setRejectionIsUnhandled =
function Promise$_setRejectionIsUnhandled() {
    ASSERT(this.isRejected());
    this._bitField = this._bitField | IS_REJECTION_UNHANDLED;
};

Promise.prototype._unsetRejectionIsUnhandled =
function Promise$_unsetRejectionIsUnhandled() {
    this._bitField = this._bitField & (~IS_REJECTION_UNHANDLED);
};

Promise.prototype._isRejectionUnhandled =
function Promise$_isRejectionUnhandled() {
    return (this._bitField & IS_REJECTION_UNHANDLED) > 0;
};

Promise.prototype._setCarriedStackTrace =
function Promise$_setCarriedStackTrace(capturedTrace) {
    ASSERT(this.isRejected());
    this._bitField = this._bitField | IS_CARRYING_STACK_TRACE;
    //Since this field is not used in rejected promises, smuggle the trace there
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._unsetCarriedStackTrace =
function Promise$_unsetCarriedStackTrace() {
    ASSERT(this.isRejected());
    this._bitField = this._bitField & (~IS_CARRYING_STACK_TRACE);
    this._fulfillmentHandler0 = void 0;
};

Promise.prototype._isCarryingStackTrace =
function Promise$_isCarryingStackTrace() {
    return (this._bitField & IS_CARRYING_STACK_TRACE) > 0;
};

Promise.prototype._getCarriedStackTrace =
function Promise$_getCarriedStackTrace() {
    ASSERT(this.isRejected());
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : void 0;
};

Promise.prototype._receiverAt = function Promise$_receiverAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(index % CALLBACK_SIZE === 0);

    var ret;
    if (index === 0) {
        ret = this._receiver0;
    }
    else {
        ret = this[index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE];
    }
    //Only use the bound value when not calling internal methods
    if (this._isBound() && ret === void 0) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function Promise$_promiseAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(index % CALLBACK_SIZE === 0);
    if (index === 0) return this._promise0;
    return this[index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE];
};

Promise.prototype._fulfillmentHandlerAt =
function Promise$_fulfillmentHandlerAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(index % CALLBACK_SIZE === 0);
    ASSERT(!this._isCarryingStackTrace());
    if (index === 0) return this._fulfillmentHandler0;
    return this[index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE];
};

Promise.prototype._rejectionHandlerAt =
function Promise$_rejectionHandlerAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(index % CALLBACK_SIZE === 0);
    if (index === 0) return this._rejectionHandler0;
    return this[index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE];
};

Promise.prototype._unsetAt = function Promise$_unsetAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(index % CALLBACK_SIZE === 0);
     if (index === 0) {
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._promise0 =
        this._receiver0 = void 0;
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = void 0;
        }
    }
    else {
        this[index - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET] =
        this[index - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET] =
        this[index - CALLBACK_SIZE + CALLBACK_PROGRESS_OFFSET] =
        this[index - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET] =
        this[index - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET] = void 0;
    }
};

Promise.prototype._resolveFromResolver =
function Promise$_resolveFromResolver(resolver) {
    ASSERT(typeof resolver === "function");
    var promise = this;
    var localDebugging = debugging;
    if (localDebugging) {
        this._setTrace(this._resolveFromResolver, void 0);
        this._pushContext();
    }
    function Promise$_resolver(val) {
        if (promise._tryFollow(val)) {
            return;
        }
        promise._fulfill(val);
    }
    function Promise$_rejecter(val) {
        var trace = canAttach(val) ? val : new Error(val + "");
        promise._attachExtraTrace(trace);
        markAsOriginatingFromRejection(val);
        promise._reject(val, trace === val ? void 0 : trace);
    }
    var r = tryCatch2(resolver, void 0, Promise$_resolver, Promise$_rejecter);
    if (localDebugging) this._popContext();

    if (r !== void 0 && r === errorObj) {
        var e = r.e;
        var trace = canAttach(e) ? e : new Error(e + "");
        promise._reject(e, trace);
    }
};

Promise.prototype._addCallbacks = function Promise$_addCallbacks(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    var index = this._length();

    if (index >= MAX_LENGTH - CALLBACK_SIZE) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== void 0) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace())
            this._fulfillmentHandler0 = fulfill;
        if (typeof reject === "function") this._rejectionHandler0 = reject;
        if (typeof progress === "function") this._progressHandler0 = progress;
    }
    else {
        var i = index - CALLBACK_SIZE;
        this[i + CALLBACK_PROMISE_OFFSET] = promise;
        this[i + CALLBACK_RECEIVER_OFFSET] = receiver;
        this[i + CALLBACK_FULFILL_OFFSET] = typeof fulfill === "function"
                                            ? fulfill : void 0;
        this[i + CALLBACK_REJECT_OFFSET] = typeof reject === "function"
                                            ? reject : void 0;
        this[i + CALLBACK_PROGRESS_OFFSET] = typeof progress === "function"
                                            ? progress : void 0;
    }
    this._setLength(index + CALLBACK_SIZE);
    return index;
};



Promise.prototype._setBoundTo = function Promise$_setBoundTo(obj) {
    if (obj !== void 0) {
        this._bitField = this._bitField | IS_BOUND;
        this._boundTo = obj;
    }
    else {
        this._bitField = this._bitField & (~IS_BOUND);
    }
};

Promise.prototype._isBound = function Promise$_isBound() {
    return (this._bitField & IS_BOUND) === IS_BOUND;
};

Promise.prototype._spreadSlowCase =
function Promise$_spreadSlowCase(targetFn, promise, values, boundTo) {
    ASSERT(isArray(values));
    ASSERT(typeof targetFn === "function");
    ASSERT(isPromise(promise));

    var promiseForAll =
            Promise$_CreatePromiseArray
                (values, PromiseArray, this._spreadSlowCase, boundTo)
            .promise()
            ._then(function() {
                return targetFn.apply(boundTo, arguments);
            }, void 0, void 0, APPLY, void 0, this._spreadSlowCase);

    promise._follow(promiseForAll);
};

Promise.prototype._callSpread =
function Promise$_callSpread(handler, promise, value, localDebugging) {
    //Array of non-promise values is fast case
    //.spread has a bit convoluted semantics otherwise
    var boundTo = this._isBound() ? this._boundTo : void 0;
    if (isArray(value)) {
        //Shouldnt be many items to loop through
        //since the spread target callback will have
        //a formal parameter for each item in the array
        var caller = this._settlePromiseFromHandler;
        for (var i = 0, len = value.length; i < len; ++i) {
            if (isPromise(Promise._cast(value[i], caller, void 0))) {
                this._spreadSlowCase(handler, promise, value, boundTo);
                return;
            }
        }
    }
    if (localDebugging) promise._pushContext();
    return tryCatchApply(handler, value, boundTo);
};

Promise.prototype._callHandler =
function Promise$_callHandler(
    handler, receiver, promise, value, localDebugging) {
    //Special receiver that means we are .applying an array of arguments
    //(for .spread() at the moment)
    var x;
    if (receiver === APPLY && !this.isRejected()) {
        x = this._callSpread(handler, promise, value, localDebugging);
    }
    else {
        if (localDebugging) promise._pushContext();
        x = tryCatch1(handler, receiver, value);
    }
    if (localDebugging) promise._popContext();
    return x;
};

Promise.prototype._settlePromiseFromHandler =
function Promise$_settlePromiseFromHandler(
    handler, receiver, value, promise
) {
    //if promise is not instanceof Promise
    //it is internally smuggled data
    if (!isPromise(promise)) {
        handler.call(receiver, value, promise);
        return;
    }

    var localDebugging = debugging;
    var x = this._callHandler(handler, receiver,
                                promise, value, localDebugging);

    if (promise._isFollowing()) return;

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise
                    ? makeSelfResolutionError()
                    : x.e;
        var trace = canAttach(err) ? err : new Error(err + "");
        if (x !== NEXT_FILTER) promise._attachExtraTrace(trace);
        promise._rejectUnchecked(err, trace);
    }
    else {
        var castValue = Promise._cast(x,
                    localDebugging ? this._settlePromiseFromHandler : void 0,
                    promise);

        if (isPromise(castValue)) {
            if (castValue.isRejected() &&
                !castValue._isCarryingStackTrace() &&
                !canAttach(castValue._settledValue)) {
                var trace = new Error(castValue._settledValue + "");
                promise._attachExtraTrace(trace);
                castValue._setCarriedStackTrace(trace);
            }
            promise._follow(castValue);
            if (castValue._cancellable()) {
                promise._cancellationParent = castValue;
                promise._setCancellable();
            }
        }
        else {
            promise._fulfillUnchecked(x);
        }
    }
};

Promise.prototype._follow =
function Promise$_follow(promise) {
    ASSERT(arguments.length === 1);
    ASSERT(this._isFollowingOrFulfilledOrRejected() === false);
    ASSERT(isPromise(promise));
    ASSERT(promise !== this);
    this._setFollowing();

    if (promise.isPending()) {
        if (promise._cancellable() ) {
            this._cancellationParent = promise;
            this._setCancellable();
        }
        promise._proxyPromise(this);
    }
    else if (promise.isFulfilled()) {
        this._fulfillUnchecked(promise._settledValue);
    }
    else {
        this._rejectUnchecked(promise._settledValue,
            promise._getCarriedStackTrace());
    }

    if (promise._isRejectionUnhandled()) promise._unsetRejectionIsUnhandled();

    if (debugging &&
        promise._traceParent == null) {
        promise._traceParent = this;
    }
};

Promise.prototype._tryFollow =
function Promise$_tryFollow(value) {
    ASSERT(arguments.length === 1);
    if (this._isFollowingOrFulfilledOrRejected() ||
        value === this) {
        return false;
    }
    var maybePromise = Promise._cast(value, this._tryFollow, void 0);
    if (!isPromise(maybePromise)) {
        return false;
    }
    this._follow(maybePromise);
    return true;
};

Promise.prototype._resetTrace = function Promise$_resetTrace(caller) {
    if (debugging) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        this._trace = new CapturedTrace(
            typeof caller === "function"
            ? caller
            : this._resetTrace,
            isTopLevel
       );
    }
};

Promise.prototype._setTrace = function Promise$_setTrace(caller, parent) {
    ASSERT(this._trace == null);
    if (debugging) {
        var context = this._peekContext();
        this._traceParent = context;
        var isTopLevel = context === void 0;
        if (parent !== void 0 &&
            parent._traceParent === context) {
            ASSERT(parent._trace != null);
            this._trace = parent._trace;
        }
        else {
            this._trace = new CapturedTrace(
                typeof caller === "function"
                ? caller
                : this._setTrace,
                isTopLevel
           );
        }
    }
    return this;
};

Promise.prototype._attachExtraTrace =
function Promise$_attachExtraTrace(error) {
    if (debugging) {
        ASSERT(canAttach(error));
        var promise = this;
        var stack = error.stack;
        stack = typeof stack === "string"
            ? stack.split("\n") : [];
        var headerLineCount = 1;

        while(promise != null &&
            promise._trace != null) {
            stack = CapturedTrace.combine(
                stack,
                promise._trace.stack.split("\n")
           );
            promise = promise._traceParent;
        }

        var max = Error.stackTraceLimit + headerLineCount;
        var len = stack.length;
        if (len  > max) {
            stack.length = max;
        }
        if (stack.length <= headerLineCount) {
            error.stack = "(No stack trace)";
        }
        else {
            error.stack = stack.join("\n");
        }
    }
};

Promise.prototype._cleanValues = function Promise$_cleanValues() {
    if (this._cancellable()) {
        this._cancellationParent = void 0;
    }
};

Promise.prototype._fulfill = function Promise$_fulfill(value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject =
function Promise$_reject(reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function Promise$_settlePromiseAt(index) {
    var handler = this.isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    ASSERT(this.isFulfilled() || this.isRejected());

    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    var promise = this._promiseAt(index);

    if (typeof handler === "function") {
        this._settlePromiseFromHandler(handler, receiver, value, promise);
    }
    else {
        var done = false;
        var isFulfilled = this.isFulfilled();
        //optimization when .then listeners on a promise are
        //just respective fate sealers on some other promise
        if (receiver !== void 0) {
            if (receiver instanceof Promise &&
                receiver._isProxied()) {
                //Must be smuggled data if proxied
                ASSERT(!isPromise(promise));
                receiver._unsetProxied();

                if (isFulfilled) receiver._fulfillUnchecked(value);
                else receiver._rejectUnchecked(value,
                    this._getCarriedStackTrace());
                done = true;
            }
            else if (isPromiseArrayProxy(receiver, promise)) {

                if (isFulfilled) receiver._promiseFulfilled(value, promise);
                else receiver._promiseRejected(value, promise);

                done = true;
            }
        }

        if (!done) {

            if (isFulfilled) promise._fulfill(value);
            else promise._reject(value, this._getCarriedStackTrace());

        }
    }

    //this is only necessary against index inflation with long lived promises
    //that accumulate the index size over time,
    //not because the data wouldn't be GCd otherwise
    if (index >= 256) {
        this._queueGC();
    }
};

Promise.prototype._isProxied = function Promise$_isProxied() {
    return (this._bitField & IS_PROXIED) === IS_PROXIED;
};

Promise.prototype._setProxied = function Promise$_setProxied() {
    this._bitField = this._bitField | IS_PROXIED;
};

Promise.prototype._unsetProxied = function Promise$_unsetProxied() {
    this._bitField = this._bitField & (~IS_PROXIED);
};

Promise.prototype._isGcQueued = function Promise$_isGcQueued() {
    return (this._bitField & IS_GC_QUEUED) === IS_GC_QUEUED;
};

Promise.prototype._setGcQueued = function Promise$_setGcQueued() {
    this._bitField = this._bitField | IS_GC_QUEUED;
};

Promise.prototype._unsetGcQueued = function Promise$_unsetGcQueued() {
    this._bitField = this._bitField & (~IS_GC_QUEUED);
};

Promise.prototype._queueGC = function Promise$_queueGC() {
    if (this._isGcQueued()) return;
    this._setGcQueued();
    async.invokeLater(this._gc, this, void 0);
};

Promise.prototype._gc = function Promise$gc() {
    var len = this._length();
    this._unsetAt(0);
    for (var i = 0; i < len; i++) {
        //Delete is cool on array indexes
        delete this[i];
    }
    this._setLength(0);
    this._unsetGcQueued();
};

Promise.prototype._queueSettleAt = function Promise$_queueSettleAt(index) {
    ASSERT(typeof index === "number");
    ASSERT(index >= 0);
    ASSERT(this.isFulfilled() || this.isRejected());
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    async.invoke(this._settlePromiseAt, this, index);
};

Promise.prototype._fulfillUnchecked =
function Promise$_fulfillUnchecked(value) {
    if (!this.isPending()) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, void 0);
    }
    this._cleanValues();
    this._setFulfilled();
    this._settledValue = value;
    var len = this._length();

    if (len > 0) {
        async.invoke(this._fulfillPromises, this, len);
    }
};

Promise.prototype._rejectUncheckedCheckError =
function Promise$_rejectUncheckedCheckError(reason) {
    var trace = canAttach(reason) ? reason : new Error(reason + "");
    this._rejectUnchecked(reason, trace === reason ? void 0 : trace);
};

Promise.prototype._rejectUnchecked =
function Promise$_rejectUnchecked(reason, trace) {
    if (!this.isPending()) return;
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._cleanValues();
    this._setRejected();
    this._settledValue = reason;

    if (this._isFinal()) {
        ASSERT(this._length() === 0);
        async.invokeLater(thrower, void 0, trace === void 0 ? reason : trace);
        return;
    }
    var len = this._length();

    if (trace !== void 0) this._setCarriedStackTrace(trace);

    if (len > 0) {
        async.invoke(this._rejectPromises, this, null);
    }
    else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._rejectPromises = function Promise$_rejectPromises() {
    ASSERT(this.isRejected());
    var len = this._length();
    for (var i = 0; i < len; i+= CALLBACK_SIZE) {
        this._settlePromiseAt(i);
    }
    this._unsetCarriedStackTrace();
};

Promise.prototype._fulfillPromises = function Promise$_fulfillPromises(len) {
    ASSERT(this.isFulfilled());
    len = this._length();
    for (var i = 0; i < len; i+= CALLBACK_SIZE) {
        this._settlePromiseAt(i);
    }
};

Promise.prototype._ensurePossibleRejectionHandled =
function Promise$_ensurePossibleRejectionHandled() {
    this._setRejectionIsUnhandled();
    if (CapturedTrace.possiblyUnhandledRejection !== void 0) {
        async.invokeLater(this._notifyUnhandledRejection, this, void 0);
    }
};

Promise.prototype._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection() {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue;
        var trace = this._getCarriedStackTrace();

        this._unsetRejectionIsUnhandled();

        if (trace !== void 0) {
            this._unsetCarriedStackTrace();
            reason = trace;
        }
        if (typeof CapturedTrace.possiblyUnhandledRejection === "function") {
            CapturedTrace.possiblyUnhandledRejection(reason, this);
        }
    }
};

var contextStack = [];
Promise.prototype._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return void 0;

};

Promise.prototype._pushContext = function Promise$_pushContext() {
    if (!debugging) return;
    contextStack.push(this);
};

Promise.prototype._popContext = function Promise$_popContext() {
    if (!debugging) return;
    contextStack.pop();
};

function Promise$_CreatePromiseArray(
    promises, PromiseArrayConstructor, caller, boundTo) {

    ASSERT(arguments.length === 4);
    ASSERT(typeof PromiseArrayConstructor === "function");

    var list = null;
    if (isArray(promises)) {
        list = promises;
    }
    /*else if (isIterable...)*/
    else {
        list = Promise._cast(promises, caller, void 0);
        if (list !== promises) {
            list._setBoundTo(boundTo);
        }
        else if (!isPromise(list)) {
            list = null;
        }
    }
    if (list !== null) {
        return new PromiseArrayConstructor(
            list,
            typeof caller === "function"
                ? caller
                : Promise$_CreatePromiseArray,
            boundTo
       );
    }
    return {
        promise: function() {return apiRejection(COLLECTION_ERROR);}
    };
}

var old = global.Promise;

Promise.noConflict = function() {
    if (global.Promise === Promise) {
        global.Promise = old;
    }
    return Promise;
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

Promise._makeSelfResolutionError = makeSelfResolutionError;
require("./finally.js")(Promise, NEXT_FILTER);
require("./direct_resolve.js")(Promise);
require("./thenables.js")(Promise, INTERNAL);
Promise.RangeError = RangeError;
Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;
Promise.RejectionError = RejectionError;

util.toFastProperties(Promise);
util.toFastProperties(Promise.prototype);
};
