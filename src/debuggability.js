"use strict";
module.exports = function(Promise, CapturedTrace) {
var async = require("./async.js");
var Warning = require("./errors.js").Warning;
var util = require("./util.js");
var ASSERT = require("./assert.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = __DEBUG__ || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ensurePossibleRejectionHandled = function () {
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent(REJECTION_HANDLED_EVENT,
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent(UNHANDLED_REJECTION_EVENT,
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | IS_UNHANDLED_REJECTION_NOTIFIED;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~IS_UNHANDLED_REJECTION_NOTIFIED);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & IS_UNHANDLED_REJECTION_NOTIFIED) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    ASSERT(!this._isFollowing());
    ASSERT(this._isRejected());
    this._bitField = this._bitField | IS_REJECTION_UNHANDLED;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    ASSERT(!this._isFollowing());
    this._bitField = this._bitField & (~IS_REJECTION_UNHANDLED);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    ASSERT(!this._isFollowing());
    return (this._bitField & IS_REJECTION_UNHANDLED) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    ASSERT(!this._isFollowing());
    ASSERT(this._isRejected());
    this._bitField = this._bitField | IS_CARRYING_STACK_TRACE;
    //Since this field is not used in rejected promises, smuggle the trace there
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    ASSERT(!this._isFollowing());
    return (this._bitField & IS_CARRYING_STACK_TRACE) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    ASSERT(this._isRejected());
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    ASSERT(arguments.length === 0);
    ASSERT(this._trace == null);
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    possiblyUnhandledRejection = typeof fn === "function" ? fn : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    unhandledRejectionHandled = typeof fn === "function" ? fn : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error(LONG_STACK_TRACES_ERROR);
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};
