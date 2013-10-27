"use strict";
module.exports = function( Promise ) {
    var errors = require( "./errors.js" );
    var async = require( "./async.js" );
    var CancellationError = errors.CancellationError;

    Promise.prototype.cancel = function Promise$cancel() {
        if( !this.isCancellable() ) return this;
        var cancelTarget = this;
        //Propagate to the last parent that is still pending
        //Resolved promises always have ._cancellationParent === void 0
        while( cancelTarget._cancellationParent !== void 0 ) {
            cancelTarget = cancelTarget._cancellationParent;
        }
        //The propagated parent or original and had no parents
        if( cancelTarget === this ) {
            var err = new CancellationError();
            this._attachExtraTrace( err );
            this._reject( err );
        }
        else {
            //Have pending parents, call cancel on the oldest
            async.invoke( cancelTarget.cancel, cancelTarget, void 0 );
        }
        return this;
    };

    Promise.prototype.uncancellable = function Promise$uncancellable() {
        var ret = new Promise();
        ret._setTrace( this.uncancellable, this );
        ret._unsetCancellable();
        ret._assumeStateOf( this, MUST_ASYNC );
        ret._boundTo = this._boundTo;
        return ret;
    };

    Promise.prototype.fork =
    function Promise$fork( didFulfill, didReject, didProgress ) {
        var ret = this._then( didFulfill, didReject, didProgress,
            void 0, void 0, this.fork );
        ret._cancellationParent = void 0;
        return ret;
    };
};
