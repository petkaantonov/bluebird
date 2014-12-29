"use strict";
module.exports = function(Promise, INTERNAL) {
var errors = require("./errors.js");
var canAttachTrace = errors.canAttachTrace;
var async = require("./async.js");
var ASSERT = require("./assert.js");
var util = require("./util.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    //Propagate to the last cancellable parent
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    ASSERT(promiseToReject.isCancellable());
    this._unsetCancellable();
    var trace = canAttachTrace(reason) ? reason
                                       : new Error(util.toString(reason));
    promiseToReject._attachExtraTrace(trace);
    promiseToReject._target()._rejectUnchecked(reason, trace);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, PROPAGATE_TRACE | PROPAGATE_BIND);
    ret._follow(this);
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};
