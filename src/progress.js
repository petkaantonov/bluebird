"use strict";
module.exports = function(Promise, isPromiseArrayProxy) {
    var ASSERT = require("./assert.js");
    var util = require("./util.js");
    var async = require("./async.js");
    var errors = require("./errors.js");
    var tryCatch1 = util.tryCatch1;
    var errorObj = util.errorObj;

    Promise.prototype.progressed = function Promise$progressed(handler) {
        return this._then(void 0, void 0, handler,
                            void 0, void 0, this.progressed);
    };

    Promise.prototype._progress = function Promise$_progress(progressValue) {
        if (this._isFollowingOrFulfilledOrRejected()) return;
        this._progressUnchecked(progressValue);

    };

    Promise.prototype._progressHandlerAt =
    function Promise$_progressHandlerAt(index) {
        ASSERT(typeof index === "number");
        ASSERT(index >= 0);
        ASSERT(index % CALLBACK_SIZE === 0);
        if (index === 0) return this._progressHandler0;
        return this[index + CALLBACK_PROGRESS_OFFSET - CALLBACK_SIZE];
    };

    Promise.prototype._doProgressWith =
    function Promise$_doProgressWith(progression) {
        var progressValue = progression.value;
        var handler = progression.handler;
        var promise = progression.promise;
        var receiver = progression.receiver;

        ASSERT(typeof handler === "function");
        ASSERT(Promise.is(promise));

        this._pushContext();
        var ret = tryCatch1(handler, receiver, progressValue);
        this._popContext();

        if (ret === errorObj) {
            //2.4 if the onProgress callback throws an exception
            //with a name property equal to 'StopProgressPropagation',
            //then the error is silenced.
            if (ret.e != null &&
                ret.e.name !== "StopProgressPropagation") {
                //2.3 Unless the onProgress callback throws an exception
                //with a name property equal to
                //'StopProgressPropagation',
                // the result of the function is used as the progress
                //value to propagate.
                var trace = errors.canAttach(ret.e)
                    ? ret.e : new Error(ret.e + "");
                promise._attachExtraTrace(trace);
                promise._progress(ret.e);
            }
        }
        //2.2 The onProgress callback may return a promise.
        else if (Promise.is(ret)) {
            //2.2.1 The callback is not considered complete
            //until the promise is fulfilled.

            //2.2.2 The fulfillment value of the promise is the value
            //to be propagated.

            //2.2.3 If the promise is rejected, the rejection reason
            //should be treated as if it was thrown by the callback
            //directly.
            ret._then(promise._progress, null, null, promise, void 0,
                this._progress);
        }
        else {
            promise._progress(ret);
        }
    };


    Promise.prototype._progressUnchecked =
    function Promise$_progressUnchecked(progressValue) {
        if (!this.isPending()) return;
        var len = this._length();

        for (var i = 0; i < len; i += CALLBACK_SIZE) {
            var handler = this._progressHandlerAt(i);
            var promise = this._promiseAt(i);
            //if promise is not instanceof Promise
            //it is internally smuggled data
            if (!Promise.is(promise)) {
                var receiver = this._receiverAt(i);
                if (typeof handler === "function") {
                    handler.call(receiver, progressValue, promise);
                }
                else if (Promise.is(receiver) && receiver._isProxied()) {
                    receiver._progressUnchecked(progressValue);
                }
                else if (isPromiseArrayProxy(receiver, promise)) {
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
            }
            else {
                async.invoke(promise._progress, promise, progressValue);
            }
        }
    };
};
