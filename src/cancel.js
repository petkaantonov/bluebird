"use strict";
module.exports = function(Promise, INTERNAL) {
    var errors = require("./errors.js");
    var async = require("./async.js");
    var ASSERT = require("./assert.js");
    var CancellationError = errors.CancellationError;
    var SYNC_TOKEN = {};

    Promise.prototype._cancel = function Promise$_cancel(reason) {
        if (!this.isCancellable()) return this;
        var parent;
        //Propagate to the last cancellable parent
        if ((parent = this._cancellationParent) !== void 0) {
            parent.cancel(reason, SYNC_TOKEN);
            return;
        }

        if (reason === undefined) {
            reason = new CancellationError();
            this._attachExtraTrace(reason);
        }
        this._rejectUnchecked(reason);
    };

    Promise.prototype.cancel = function Promise$cancel(reason, token) {
        if (!this.isCancellable()) return this;
        ASSERT("_cancellationParent" in this);

        if (reason === undefined) {
            var err = new CancellationError();
            this._attachExtraTrace(err);
        }

        if (token === SYNC_TOKEN) {
            this._cancel(reason);
            return this;
        }

        async.invokeLater(this._cancel, this, reason);
        return this;
    };

    Promise.prototype.cancellable = function Promise$cancellable() {
        if (this._cancellable()) return this;
        this._setCancellable();
        this._cancellationParent = void 0;
        return this;
    };

    Promise.prototype.uncancellable = function Promise$uncancellable() {
        var ret = new Promise(INTERNAL);
        ret._setTrace(this.uncancellable, this);
        ret._follow(this);
        ret._unsetCancellable();
        if (this._isBound()) ret._setBoundTo(this._boundTo);
        return ret;
    };

    Promise.prototype.fork =
    function Promise$fork(didFulfill, didReject, didProgress) {
        var ret = this._then(didFulfill, didReject, didProgress,
            void 0, void 0, this.fork);

        ret._setCancellable();
        ret._cancellationParent = void 0;
        return ret;
    };
};
