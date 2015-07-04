"use strict";
module.exports = function(Promise, PromiseArray) {
var ASSERT = require("./assert.js");
var util = require("./util.js");
var async = require("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - CALLBACK_SIZE + CALLBACK_PROGRESS_OFFSET];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    ASSERT(typeof handler === "function");
    ASSERT(promise instanceof Promise);
    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        var e = errorObj.e;
        errorObj.e = null;
        //2.4 if the onProgress callback throws an exception
        //with a name property equal to 'StopProgressPropagation',
        //then the error is silenced.
        if (e != null &&
            e.name !== "StopProgressPropagation") {
            //2.3 Unless the onProgress callback throws an exception
            //with a name property equal to
            //'StopProgressPropagation',
            // the result of the function is used as the progress
            //value to propagate.
            var trace = util.canAttachTrace(e)
                ? e : new Error(util.toString(e));
            promise._attachExtraTrace(trace);
            promise._progress(e);
        }
    //2.2 The onProgress callback may return a promise.
    } else if (ret instanceof Promise) {
        //2.2.1 The callback is not considered complete
        //until the promise is fulfilled.

        //2.2.2 The fulfillment value of the promise is the value
        //to be propagated.

        //2.2.3 If the promise is rejected, the rejection reason
        //should be treated as if it was thrown by the callback
        //directly.
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    ASSERT(!this._isFollowingOrFulfilledOrRejected());
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        //if promise is not instanceof Promise
        //it is internally smuggled data
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};
