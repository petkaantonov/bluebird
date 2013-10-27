"use strict";
module.exports = function( Promise ) {
    var ASSERT = require( "./assert.js");
    var util = require( "./util.js" );
    var async = require( "./async.js" );
    var tryCatch1 = util.tryCatch1;
    var errorObj = util.errorObj;

    Promise.prototype.progressed = function Promise$progressed( fn ) {
        return this._then( void 0, void 0, fn,
                            void 0, void 0, this.progressed );
    };

    Promise.prototype._progress = function Promise$_progress( progressValue ) {
        if( this._isFollowingOrFulfilledOrRejected() ) return;
        this._resolveProgress( progressValue );

    };

    Promise.prototype._progressAt = function Promise$_progressAt( index ) {
        ASSERT( typeof index === "number" );
        ASSERT( index >= 0 );
        ASSERT( index % CALLBACK_SIZE === 0 );
        if( index === 0 ) return this._progress0;
        return this[ index + CALLBACK_PROGRESS_OFFSET - CALLBACK_SIZE ];
    };

    Promise.prototype._resolveProgress =
    function Promise$_resolveProgress( progressValue ) {
        ASSERT( this.isPending() );
        var len = this._length();
        for( var i = 0; i < len; i += CALLBACK_SIZE ) {
            var fn = this._progressAt( i );
            var promise = this._promiseAt( i );
            //if promise is not instanceof Promise
            //it is internally smuggled data
            if( !Promise.is( promise ) ) {
                fn.call( this._receiverAt( i ), progressValue, promise );
                continue;
            }
            var ret = progressValue;
            if( fn !== void 0 ) {
                this._pushContext();
                ret = tryCatch1( fn, this._receiverAt( i ), progressValue );
                this._popContext();
                if( ret === errorObj ) {
                    //2.4 if the onProgress callback throws an exception
                    //with a name property equal to 'StopProgressPropagation',
                    //then the error is silenced.
                    if( ret.e != null &&
                        ret.e.name === "StopProgressPropagation" ) {
                        ret.e[ERROR_HANDLED_KEY] = ERROR_HANDLED;
                    }
                    else {
                        //2.3 Unless the onProgress callback throws an exception
                        //with a name property equal to
                        //'StopProgressPropagation',
                        // the result of the function is used as the progress
                        //value to propagate.
                        promise._attachExtraTrace( ret.e );
                        async.invoke( promise._progress, promise, ret.e );
                    }
                }
                //2.2 The onProgress callback may return a promise.
                else if( Promise.is( ret ) ) {
                    //2.2.1 The callback is not considered complete
                    //until the promise is fulfilled.

                    //2.2.2 The fulfillment value of the promise is the value
                    //to be propagated.

                    //2.2.3 If the promise is rejected, the rejection reason
                    //should be treated as if it was thrown by the callback
                    //directly.
                    ret._then( promise._progress, null, null, promise, void 0,
                        this._progress );
                }
                else {
                    async.invoke( promise._progress, promise, ret );
                }
            }
            else {
                async.invoke( promise._progress, promise, ret );
            }
        }
    };
};
