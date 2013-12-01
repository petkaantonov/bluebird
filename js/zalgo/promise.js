/**
 * Copyright (c) 2013 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
"use strict";
module.exports = function() {
var global = require("./global.js");
var ASSERT = require("./assert.js");

var util = require("./util.js");
var async = require("./async.js");
var errors = require("./errors.js");
var PromiseArray = require("./promise_array.js")(Promise);

var CapturedTrace = require("./captured_trace.js")();
var CatchFilter = require("./catch_filter.js");
var PromiseResolver = require("./promise_resolver.js");

var isArray = util.isArray;
var notEnumerableProp = util.notEnumerableProp;
var isObject = util.isObject;
var ensurePropertyExpansion = util.ensurePropertyExpansion;
var errorObj = util.errorObj;
var tryCatch1 = util.tryCatch1;
var tryCatch2 = util.tryCatch2;
var tryCatchApply = util.tryCatchApply;

var TypeError = errors.TypeError;
var CancellationError = errors.CancellationError;
var TimeoutError = errors.TimeoutError;
var RejectionError = errors.RejectionError;
var ensureNotHandled = errors.ensureNotHandled;
var withHandledMarked = errors.withHandledMarked;
var withStackAttached = errors.withStackAttached;
var isStackAttached = errors.isStackAttached;
var isHandled = errors.isHandled;
var canAttach = errors.canAttach;
var apiRejection = require("./errors_api_rejection")(Promise);

var APPLY = {};

var makeSelfResolutionError = function Promise$_makeSelfResolutionError() {
    return new TypeError("Circular promise resolution chain");
};

Promise._makeSelfResolutionError = makeSelfResolutionError;

var INTERNAL = function(){};

function isPromise(obj) {
    if (typeof obj !== "object") return false;
    return obj instanceof Promise;
}

function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("You must pass a resolver function " +
            "as the sole argument to the promise constructor");
    }
    this._bitField = 67108864;
    this._fulfillmentHandler0 = void 0;
    this._rejectionHandler0 = void 0;
    this._progressHandler0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    this._settledValue = void 0;
    this._cancellationParent = void 0;
    this._boundTo = void 0;
    if (debugging) this._traceParent = this._peekContext();
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.bind = function Promise$bind(obj) {
    var ret = new Promise(INTERNAL);
    ret._setTrace(this.bind, this);
    ret._follow(this, true);
    ret._setBoundTo(obj);
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
                this._reject(catchFilterTypeError);
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

function thrower(r) {
    throw r;
}
function slowFinally(ret, reasonOrValue) {
    if (this.isFulfilled()) {
        return ret._then(function() {
            return reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally);
    }
    else {
        return ret._then(function() {
            ensureNotHandled(reasonOrValue);
            throw reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally);
    }
}
Promise.prototype.lastly = Promise.prototype["finally"] =
function Promise$finally(fn) {
    var r = function(reasonOrValue) {
        var ret = this._isBound() ? fn.call(this._boundTo) : fn();
        if (isPromise(ret)) {
            return slowFinally.call(this, ret, reasonOrValue);
        }

        if (this.isRejected()) {
            ensureNotHandled(reasonOrValue);
            throw reasonOrValue;
        }
        return reasonOrValue;
    };
    return this._then(r, r, void 0, this, void 0, this.lastly);
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
    return (this._bitField & 268435456) > 0;
};

Promise.prototype.isRejected = function Promise$isRejected() {
    return (this._bitField & 134217728) > 0;
};

Promise.prototype.isPending = function Promise$isPending() {
    return !this.isResolved();
};

Promise.prototype.isResolved = function Promise$isResolved() {
    return (this._bitField & 402653184) > 0;
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
    return Promise$_all(this, true, this.all);
};

Promise.is = isPromise;

function Promise$_all(promises, useBound, caller) {
    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
   ).promise();
}
Promise.all = function Promise$All(promises) {
    return Promise$_all(promises, false, Promise.all);
};

Promise.join = function Promise$Join() {
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    return Promise$_All(args, PromiseArray, Promise.join, void 0).promise();
};

Promise.resolve = Promise.fulfilled =
function Promise$Resolve(value, caller) {
    var ret = new Promise(INTERNAL);
    ret._setTrace(typeof caller === "function"
        ? caller
        : Promise.resolve, void 0);
    if (ret._tryFollow(value, false)) {
        return ret;
    }
    ret._cleanValues();
    ret._setFulfilled();
    ret._settledValue = value;
    return ret;
};

Promise.reject = Promise.rejected = function Promise$Reject(reason) {
    var ret = new Promise(INTERNAL);
    ret._setTrace(Promise.reject, void 0);
    ret._cleanValues();
    ret._setRejected();
    ret._settledValue = reason;
    return ret;
};

Promise.prototype._resolveFromSyncValue =
function Promise$_resolveFromSyncValue(value, caller) {
    if (value === errorObj) {
        this._cleanValues();
        this._setRejected();
        this._settledValue = value.e;
    }
    else {
        var maybePromise = Promise._cast(value, caller, void 0);
        if (maybePromise instanceof Promise) {
            this._follow(maybePromise, true);
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
        throw new TypeError("fn must be a function");
    }
    return function Promise$_method() {
        var value;
        switch(arguments.length) {
        case 0: value = tryCatch1(fn, this, void 0); break;
        case 1: value = tryCatch1(fn, this, arguments[0]); break;
        case 2: value = tryCatch2(fn, this, arguments[0], arguments[1]); break;
        default:
            var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
            value = tryCatchApply(fn, args, this); break;
        }
        var ret = new Promise(INTERNAL);
        ret._setTrace(Promise$_method, void 0);
        ret._resolveFromSyncValue(value, Promise$_method);
        return ret;
    };
};

Promise["try"] = Promise.attempt = function Promise$_Try(fn, args, ctx) {

    if (typeof fn !== "function") {
        return apiRejection("fn must be a function");
    }
    var value = isArray(args)
        ? tryCatchApply(fn, args, ctx)
        : tryCatch1(fn, ctx, args);

    var ret = new Promise(INTERNAL);
    ret._setTrace(Promise.attempt, void 0);
    ret._resolveFromSyncValue(value, Promise.attempt);
    return ret;
};

Promise.defer = Promise.pending = function Promise$Defer(caller) {
    var promise = new Promise(INTERNAL);
    promise._setTrace(typeof caller === "function"
                              ? caller : Promise.defer, void 0);
    return new PromiseResolver(promise);
};

Promise.bind = function Promise$Bind(thisArg) {
    var ret = new Promise(INTERNAL);
    ret._setTrace(Promise.bind, void 0);
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

var debugging = false || !!(
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
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    debugging = true;
};

Promise.hasLongStackTraces = function Promise$HasLongStackTraces() {
    return debugging && CapturedTrace.isSupported();
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
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (debugging && !haveInternalData) {
        var haveSameContext = this._peekContext() === this._traceParent;
        ret._traceParent = haveSameContext ? this._traceParent : this;
        ret._setTrace(typeof caller === "function" ?
            caller : this._then, this);
    }

    if (!haveInternalData) {
        ret._boundTo = this._boundTo;
    }

    var callbackIndex =
        this._addCallbacks(didFulfill, didReject, didProgress, ret, receiver);

    if (this.isResolved()) {
        this._queueSettleAt(callbackIndex);
    }
    else if (!haveInternalData && this.isCancellable()) {
        ret._cancellationParent = this;
    }

    return ret;
};

Promise.prototype._length = function Promise$_length() {
    return this._bitField & 16777215;
};

Promise.prototype._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._setLength = function Promise$_setLength(len) {
    this._bitField = (this._bitField & -16777216) |
        (len & 16777215) ;
};

Promise.prototype._cancellable = function Promise$_cancellable() {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function Promise$_isFinal() {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._receiverAt = function Promise$_receiverAt(index) {
    var ret;
    if (index === 0) {
        ret = this._receiver0;
    }
    else {
        ret = this[index + 4 - 5];
    }
    if (this._isBound() && ret === void 0) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function Promise$_promiseAt(index) {
    if (index === 0) return this._promise0;
    return this[index + 3 - 5];
};

Promise.prototype._fulfillmentHandlerAt =
function Promise$_fulfillmentHandlerAt(index) {
    if (index === 0) return this._fulfillmentHandler0;
    return this[index + 0 - 5];
};

Promise.prototype._rejectionHandlerAt =
function Promise$_rejectionHandlerAt(index) {
    if (index === 0) return this._rejectionHandler0;
    return this[index + 1 - 5];
};

Promise.prototype._unsetAt = function Promise$_unsetAt(index) {
    if (index === 0) {
        this._fulfillmentHandler0 =
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._promise0 =
        this._receiver0 = void 0;
    }
    else {
        this[index - 5 + 0] =
        this[index - 5 + 1] =
        this[index - 5 + 2] =
        this[index - 5 + 3] =
        this[index - 5 + 4] = void 0;
    }
};

Promise.prototype._resolveFromResolver =
function Promise$_resolveFromResolver(resolver) {
    this._setTrace(this._resolveFromResolver, void 0);
    var p = new PromiseResolver(this);
    this._pushContext();
    var r = tryCatch2(resolver, this, function Promise$_fulfiller(val) {
        p.fulfill(val);
    }, function Promise$_rejecter(val) {
        p.reject(val);
    });
    this._popContext();
    if (r === errorObj) {
        p.reject(r.e);
    }
};

Promise.prototype._addCallbacks = function Promise$_addCallbacks(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    fulfill = typeof fulfill === "function" ? fulfill : void 0;
    reject = typeof reject === "function" ? reject : void 0;
    progress = typeof progress === "function" ? progress : void 0;
    var index = this._length();

    if (index >= 16777215 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._fulfillmentHandler0 = fulfill;
        this._rejectionHandler0  = reject;
        this._progressHandler0 = progress;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength(index + 5);
        return index;
    }

    this[index - 5 + 0] = fulfill;
    this[index - 5 + 1] = reject;
    this[index - 5 + 2] = progress;
    this[index - 5 + 3] = promise;
    this[index - 5 + 4] = receiver;

    this._setLength(index + 5);
    return index;
};

Promise.prototype._spreadSlowCase =
function Promise$_spreadSlowCase(targetFn, promise, values, boundTo) {
    promise._follow(
            Promise$_All(values, PromiseArray, this._spreadSlowCase, boundTo)
            .promise()
            ._then(function() {
                return targetFn.apply(boundTo, arguments);
            }, void 0, void 0, APPLY, void 0,
                    this._spreadSlowCase),
        false
   );
};

Promise.prototype._setBoundTo = function Promise$_setBoundTo(obj) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function Promise$_isBound() {
    return this._boundTo !== void 0;
};


var ignore = CatchFilter.prototype.doFilter;
Promise.prototype._settlePromiseFromHandler =
function Promise$_settlePromiseFromHandler(
    handler, receiver, value, promise
) {

    if (!isPromise(promise)) {
        handler.call(receiver, value, promise);
        return;
    }

    var isRejected = this.isRejected();

    if (isRejected &&
        typeof value === "object" &&
        value !== null) {
        var handledState = value["__promiseHandled__"];

        if (handledState === void 0) {
            notEnumerableProp(value, "__promiseHandled__", 2);
        }
        else {
            value["__promiseHandled__"] =
                withHandledMarked(handledState);
        }
    }

    var x;
    if (!isRejected && receiver === APPLY) {
        if (isArray(value)) {
            var caller = this._settlePromiseFromHandler;
            for (var i = 0, len = value.length; i < len; ++i) {
                if (isPromise(Promise._cast(value[i], caller, void 0))) {
                    this._spreadSlowCase(
                        handler,
                        promise,
                        value,
                        this._boundTo
                   );
                    return;
                }
            }
            promise._pushContext();
            x = tryCatchApply(handler, value, this._boundTo);
        }
        else {
            this._spreadSlowCase(handler, promise,
                    value, this._boundTo);
            return;
        }
    }
    else {
        promise._pushContext();
        x = tryCatch1(handler, receiver, value);
    }

    promise._popContext();

    if (x === errorObj) {
        ensureNotHandled(x.e);
        if (handler !== ignore) {
            promise._attachExtraTrace(x.e);
        }
        promise._reject(x.e);
    }
    else if (x === promise) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        promise._reject(err);
    }
    else {
        var castValue = Promise._cast(x, this._settlePromiseFromHandler,
                                        promise);
        var isThenable = castValue !== x;

        if (isThenable || isPromise(castValue)) {
            promise._follow(castValue, true);
        }
        else {
            promise._fulfill(x);
        }
    }
};

Promise.prototype._follow =
function Promise$_follow(promise, mustAsync) {
    this._setFollowing();

    if (promise.isPending()) {
        if (promise._cancellable() ) {
            this._cancellationParent = promise;
        }
        promise._then(
            this._fulfillUnchecked,
            this._rejectUnchecked,
            this._progressUnchecked,
            this,
            null,
            this._follow
       );
    }
    else if (promise.isFulfilled()) {
        if (mustAsync === true)
            this._fulfillUnchecked(promise._settledValue);
        else
            this._fulfillUnchecked(promise._settledValue);
    }
    else {
        if (mustAsync === true)
            this._rejectUnchecked(promise._settledValue);
        else
            this._rejectUnchecked(promise._settledValue);
    }

    if (debugging &&
        promise._traceParent == null) {
        promise._traceParent = this;
    }
};

Promise.prototype._tryFollow =
function Promise$_tryFollow(value, mustAsync) {
    if (this._isFollowingOrFulfilledOrRejected() ||
        value === this) {
        return false;
    }
    var maybePromise = Promise._cast(value, this._tryFollow, void 0);
    if (!isPromise(maybePromise)) {
        return false;
    }
    this._follow(maybePromise, mustAsync);
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
    if (debugging) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        if (parent !== void 0 &&
            parent._traceParent === context) {
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
    if (debugging &&
        canAttach(error)) {
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
        error["__promiseHandled__"] =
            withStackAttached(error["__promiseHandled__"]);
    }
};

Promise.prototype._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection(reason) {
    if (!isHandled(reason["__promiseHandled__"])) {
        reason["__promiseHandled__"] =
            withHandledMarked(reason["__promiseHandled__"]);
        CapturedTrace.possiblyUnhandledRejection(reason, this);
    }
};

Promise.prototype._unhandledRejection =
function Promise$_unhandledRejection(reason) {
    if (!isHandled(reason["__promiseHandled__"])) {
        async.invokeLater(this._notifyUnhandledRejection, this, reason);
    }
};

Promise.prototype._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

Promise.prototype._fulfill = function Promise$_fulfill(value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);

};

Promise.prototype._reject = function Promise$_reject(reason) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason);
};

Promise.prototype._settlePromiseAt = function Promise$_settlePromiseAt(index) {
    var handler = this.isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    var promise = this._promiseAt(index);

    if (typeof handler === "function") {
        this._settlePromiseFromHandler(handler, receiver, value, promise);
    }
    else if (this.isFulfilled()) {
        promise._fulfill(value);
    }
    else {
        promise._reject(value);
    }

    if (index >= 256) {
        this._queueGC();
    }
};

Promise.prototype._isGcQueued = function Promise$_isGcQueued() {
    return (this._bitField & -1073741824) === -1073741824;
};

Promise.prototype._setGcQueued = function Promise$_setGcQueued() {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetGcQueued = function Promise$_unsetGcQueued() {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueGC = function Promise$_queueGC() {
    if (this._isGcQueued()) return;
    this._setGcQueued();
    async.invokeLater(this._gc, this, void 0);
};

Promise.prototype._gc = function Promise$gc() {
    var len = this._length() - 5;
    this._unsetAt(0);
    for (var i = 0; i < len; i++) {
        delete this[i];
    }
    this._setLength(0);
    this._unsetGcQueued();
};

Promise.prototype._queueSettleAt = function Promise$_queueSettleAt(index) {
    this._settlePromiseAt(index);
};

Promise.prototype._fulfillUnchecked =
function Promise$_fulfillUnchecked(value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._cleanValues();
    this._setFulfilled();
    this._settledValue = value;
    var len = this._length();

    for (var i = 0; i < len; i+= 5) {
        this._settlePromiseAt(i);
    }

};

Promise.prototype._rejectUnchecked =
function Promise$_rejectUnchecked(reason) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._cleanValues();
    this._setRejected();
    this._settledValue = reason;
    if (this._isFinal()) {
        async.invokeLater(thrower, void 0, reason);
        return;
    }
    var len = this._length();
    var rejectionWasHandled = false;
    for (var i = 0; i < len; i+= 5) {
        var handler = this._rejectionHandlerAt(i);
        if (!rejectionWasHandled) {
            rejectionWasHandled = handler !== void 0 ||
                                this._promiseAt(i)._length() > 0;
        }
        this._settlePromiseAt(i);
    }

    if (!rejectionWasHandled &&
        CapturedTrace.possiblyUnhandledRejection !== void 0
   ) {

        if (isObject(reason)) {
            var handledState = reason["__promiseHandled__"];
            var newReason = reason;

            if (handledState === void 0) {
                newReason = ensurePropertyExpansion(reason,
                    "__promiseHandled__", 0);
                handledState = 0;
            }
            else if (isHandled(handledState)) {
                return;
            }

            if (!isStackAttached(handledState))  {
                this._attachExtraTrace(newReason);
            }
            this._unhandledRejection(newReason);

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

function Promise$_All(promises, PromiseArray, caller, boundTo) {

    var list = null;
    if (isArray(promises)) {
        list = promises;
    }
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
        return new PromiseArray(
            list,
            typeof caller === "function"
                ? caller
                : Promise$_All,
            boundTo
       );
    }
    return {
        promise: function() {return apiRejection("expecting an array, a promise or a thenable");}
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
    Promise.debugging = function(){};
    debugging = false;
}

require("./direct_resolve.js")(Promise);
require("./thenables.js")(Promise);
Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;
Promise.RejectionError = RejectionError;
require('./synchronous_inspection.js')(Promise);
require('./any.js')(Promise,Promise$_All,PromiseArray);
require('./race.js')(Promise,INTERNAL);
require('./call_get.js')(Promise);
require('./filter.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./generators.js')(Promise,apiRejection);
require('./map.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./nodeify.js')(Promise);
require('./promisify.js')(Promise);
require('./props.js')(Promise,PromiseArray);
require('./reduce.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./settle.js')(Promise,Promise$_All,PromiseArray);
require('./some.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./progress.js')(Promise);
require('./cancel.js')(Promise,INTERNAL);

Promise.prototype = Promise.prototype;
return Promise;

};
