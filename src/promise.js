"use strict";
module.exports = function() {
var global = require("./global.js");
var ASSERT = require("./assert.js");

var util = require( "./util.js" );
var async = require( "./async.js" );
var errors = require( "./errors.js" );
var PromiseArray = require( "./promise_array.js" )(Promise);

var CapturedTrace = require( "./captured_trace.js")();
var CatchFilter = require( "./catch_filter.js");
var PromiseResolver = require( "./promise_resolver.js" );

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


function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

function Promise( resolver ) {
    this._bitField = IS_CANCELLABLE;
    //Since most promises have exactly 1 parallel handler
    //store the first ones directly on the object
    //The rest (if needed) are stored on the object's
    //elements array (this[0], this[1]...etc)
    //which has less indirection than when using external array
    this._fulfill0 = void 0;
    this._reject0 = void 0;
    this._progress0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    //reason for rejection or fulfilled value
    this._resolvedValue = void 0;
    //Used in cancel propagation
    this._cancellationParent = void 0;
    //for .bind
    this._boundTo = void 0;
    if( longStackTraces ) this._traceParent = this._peekContext();
    if( typeof resolver === "function" ) this._resolveResolver( resolver );

}

Promise.prototype.bind = function Promise$bind( obj ) {
    var ret = new Promise();
    ret._setTrace( this.bind, this );
    ret._assumeStateOf( this, MUST_ASYNC );
    ret._setBoundTo( obj );
    return ret;
};

/**
 * @return {string}
 */
Promise.prototype.toString = function Promise$toString() {
    return "[object Promise]";
};

/**
 * Convenience Promise.prototype for .then( null, fn, null );
 *
 * @param {Function} fn The callback to call if this promise is rejected
 * @return {Promise}
 */
Promise.prototype.caught = Promise.prototype["catch"] =
function Promise$catch( fn ) {
    var len = arguments.length;
    if( len > 1 ) {
        var catchInstances = new Array( len - 1 ),
            j = 0, i;
        for( i = 0; i < len - 1; ++i ) {
            var item = arguments[i];
            if( typeof item === "function" ) {
                catchInstances[j++] = item;
            }
            else {
                var catchFilterTypeError =
                    new TypeError(
                        "A catch filter must be an error constructor "
                        + "or a filter function");

                this._attachExtraTrace( catchFilterTypeError );
                async.invoke( this._reject, this, catchFilterTypeError );
                return;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter( catchInstances, fn, this );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
};

function thrower( r ) {
    throw r;
}
function slowFinally( ret, reasonOrValue ) {
    if( this.isFulfilled() ) {
        return ret._then(function() {
            return reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
    else {
        return ret._then(function() {
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
}
/**
 * Like Q Finally
 *
 * @param {Function} fn The callback to call when this promise is
 * either fulfilled or rejected
 * @return {Promise}
 */
Promise.prototype.lastly = Promise.prototype["finally"] =
function Promise$finally( fn ) {
    var r = function( reasonOrValue ) {
        var ret = this._isBound() ? fn.call( this._boundTo ) : fn();
        if( isPromise( ret ) ) {
            return slowFinally.call( this, ret, reasonOrValue );
        }

        if( this.isRejected() ) {
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }
        return reasonOrValue;
    };
    return this._then( r, r, void 0, this, void 0, this.lastly );
};

/**
 *
 * (TODO promises/A+ .then())
 *
 * @param {=Function} didFulfill The callback to call if this promise
 *  is fulfilled.
 * @param {=Function} didReject The callback to call if this promise
 *  is rejected.
 * @param {=Function} didProgress The callback to call if this promise is
 *  notified of progress.
 * @return {Promise}
 *
 */
Promise.prototype.then =
function Promise$then( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.then );
};

/**
 * Any rejections that come here will be thrown.
 *
 */
Promise.prototype.done =
function Promise$done( didFulfill, didReject, didProgress ) {
    var promise = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.done );
    promise._setIsFinal();
};

/**
 *
 * like .then but the callback argument is assumed to be an array and
 * applied as parameters.
 *
 * Example using then vs spread:
 *
 * Promise.all([file, db, network]).then(function( results ) {
 *     results[0] //file result
 *     results[1] //db result
 *     results[2] //network result
 * });
 *
 * Promise.all([file, db, network]).spread(function( file, db, network ) {
 *     file //file result
 *     db //db result
 *     network //network result
 * });
 *
 * @param {=Function} didFulfill The callback to call if this promise
 *  is fulfilled.
 *
 */
Promise.prototype.spread = function Promise$spread( didFulfill, didReject ) {
    return this._then( didFulfill, didReject, void 0,
        APPLY, void 0, this.spread );
};
/**
 * See if this promise is fulfilled.
 *
 * @return {boolean}
 */
Promise.prototype.isFulfilled = function Promise$isFulfilled() {
    return ( this._bitField & IS_FULFILLED ) > 0;
};

/**
 * See if this promise is rejected.
 *
 * @return {boolean}
 */
Promise.prototype.isRejected = function Promise$isRejected() {
    return ( this._bitField & IS_REJECTED ) > 0;
};

/**
 * See if this promise is pending (not rejected and not fulfilled).
 *
 * @return {boolean}
 */
Promise.prototype.isPending = function Promise$isPending() {
    return !this.isResolved();
};

/**
 * See if this promise is resolved (rejected or fulfilled).
 *
 * @return {boolean}
 */
Promise.prototype.isResolved = function Promise$isResolved() {
    return ( this._bitField & IS_REJECTED_OR_FULFILLED ) > 0;
};

/**
 * See if this promise can be cancelled.
 *
 * @return {boolean}
 */
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
    if( this.isFulfilled() ) {
        ret.fulfillmentValue = this._resolvedValue;
        ret.isFulfilled = true;
    }
    else if( this.isRejected() ) {
        ret.rejectionReason = this._resolvedValue;
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function Promise$all() {
    return Promise$_all( this, USE_BOUND, this.all );
};

/**
 * See if obj is a promise from this library. Same
 * as calling `obj instanceof Promise`.
 *
 * @param {dynamic} obj The object to check.
 * @return {boolean}
 */
Promise.is = isPromise;

function Promise$_all( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === USE_BOUND ? promises._boundTo : void 0
    ).promise();
}
Promise.all = function Promise$All( promises ) {
    return Promise$_all( promises, DONT_USE_BOUND, Promise.all );
};

Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise$_All( ret, PromiseArray, Promise.join, void 0 ).promise();
};
/**
 * Create a promise that is already fulfilled with the given
 * value.
 *
 * Note that the promise will be in fulfilled state right away -
 * not on the next event tick.
 *
 * @param {dynamic} value The value the promise is fulfilled with.
 * @return {Promise}
 */
Promise.fulfilled = function Promise$Fulfilled( value, caller ) {
    var ret = new Promise();
    ret._setTrace( typeof caller === "function"
        ? caller
        : Promise.fulfilled, void 0 );
    if( ret._tryAssumeStateOf( value, MAY_SYNC ) ) {
        return ret;
    }
    ret._cleanValues();
    ret._setFulfilled();
    ret._resolvedValue = value;
    return ret;
};

/**
 * Create a promise that is already rejected with the given
 * reason.
 *
 * Note that the promise will be in rejected state right away -
 * not on the next event tick.
 *
 * @param {dynamic} reason The reason the promise is rejected.
 * @return {Promise}
 */
Promise.rejected = function Promise$Rejected( reason ) {
    var ret = new Promise();
    ret._setTrace( Promise.rejected, void 0 );
    ret._cleanValues();
    ret._setRejected();
    ret._resolvedValue = reason;
    return ret;
};

Promise["try"] = Promise.attempt = function Promise$_Try( fn, args, ctx ) {

    if( typeof fn !== "function" ) {
        return apiRejection("fn must be a function");
    }
    var value = isArray( args )
        ? tryCatchApply( fn, args, ctx )
        : tryCatch1( fn, ctx, args );

    var ret = new Promise();
    ret._setTrace( Promise.attempt, void 0 );
    if( value === errorObj ) {
        ret._cleanValues();
        ret._setRejected();
        ret._resolvedValue = value.e;
        return ret;
    }

    var maybePromise = Promise._cast(value);
    if( maybePromise instanceof Promise ) {
        ret._assumeStateOf( maybePromise, MUST_ASYNC );
    }
    else {
        ret._cleanValues();
        ret._setFulfilled();
        ret._resolvedValue = value;
    }

    return ret;
};

/**
 * Create a pending promise and a resolver for the promise.
 *
 * @return {PromiseResolver}
 */
Promise.pending = function Promise$Pending( caller ) {
    var promise = new Promise();
    promise._setTrace( typeof caller === "function"
                              ? caller : Promise.pending, void 0 );
    return new PromiseResolver( promise );
};

Promise.bind = function Promise$Bind( obj ) {
    var ret = new Promise();
    ret._setTrace( Promise.bind, void 0 );
    ret._setFulfilled();
    ret._setBoundTo( obj );
    return ret;
};

Promise.cast = function Promise$Cast( obj, caller ) {
    var ret = Promise._cast( obj, caller );
    if( !( ret instanceof Promise ) ) {
        return Promise.fulfilled( ret, caller );
    }
    return ret;
};

/**
 * If `fn` is a function, will set that function as a callback to call
 * when an possibly unhandled rejection happens. Passing anything other
 * than a function will have the effect of removing any callback
 * and possible errors can be lost forever.
 *
 * If a promise is rejected with a Javascript Error and is not handled
 * in a timely fashion, that promise's rejection is then possibly
 * unhandled. This can happen for example due to buggy code causing
 * a runtime Javascript error.
 *
 * The rejection system implemented must swallow all errors
 * thrown. However, if some promise doesn't have, or will not have,
 * a rejection handler anywhere in its chain, then this implies that
 * the error would be silently lost.
 *
 * By default, all such errors are reported on console but you may
 * use this function to override that behavior with your own handler.
 *
 * Example:
 *
 *     Promise.onPossiblyUnhandledRejection(function( err ) {
 *         throw err;
 *     });
 *
 * The above will throw any unhandled rejection and for example
 * crash a node process.
 *
 * @param {Function|dynamic} fn The callback function. If fn is not
 * a function, no rejections will be reported as possibly unhandled.
 *
 */
Promise.onPossiblyUnhandledRejection =
function Promise$OnPossiblyUnhandledRejection( fn ) {
    if( typeof fn === "function" ) {
        CapturedTrace.possiblyUnhandledRejection = fn;
    }
    else {
        CapturedTrace.possiblyUnhandledRejection = void 0;
    }
};

var longStackTraces = __DEBUG__ || __BROWSER__ || !!(
    typeof process !== "undefined" &&
    typeof process.execPath === "string" &&
    typeof process.env === "object" &&
    process.env[ "BLUEBIRD_DEBUG" ]
);


Promise.longStackTraces = function Promise$LongStackTraces() {
    if( async.haveItemsQueued() &&
        longStackTraces === false
    ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

Promise.hasLongStackTraces = function Promise$HasLongStackTraces() {
    return longStackTraces;
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
    ASSERT( arguments.length === 6 );
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise();

    if( longStackTraces && !haveInternalData ) {
        var haveSameContext = this._peekContext() === this._traceParent;
        ret._traceParent = haveSameContext ? this._traceParent : this;
        ret._setTrace( typeof caller === "function" ?
            caller : this._then, this );

    }

    if( !haveInternalData ) {
        ret._boundTo = this._boundTo;
    }

    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        async.invoke( this._resolveLast, this, callbackIndex );
    }
    else if( !haveInternalData && this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    if( this._isDelegated() ) {
        this._unsetDelegated();
        ASSERT( !this.isResolved() );
        var x = this._resolvedValue;
        if( !this._tryThenable( x ) ) {
            async.invoke( this._fulfill, this, x );
        }
    }
    return ret;
};

Promise.prototype._length = function Promise$_length() {
    ASSERT( isPromise( this ) );
    ASSERT( arguments.length === 0 );
    return this._bitField & LENGTH_MASK;
};

Promise.prototype._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return ( this._bitField & IS_FOLLOWING_OR_REJECTED_OR_FULFILLED ) > 0;
};

Promise.prototype._setLength = function Promise$_setLength( len ) {
    this._bitField = ( this._bitField & LENGTH_CLEAR_MASK ) |
        ( len & LENGTH_MASK ) ;
};

Promise.prototype._cancellable = function Promise$_cancellable() {
    return ( this._bitField & IS_CANCELLABLE ) > 0;
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

Promise.prototype._setDelegated = function Promise$_setDelegated() {
    this._bitField = this._bitField | IS_DELEGATED;
};

Promise.prototype._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | IS_FINAL;
};

Promise.prototype._isFinal = function Promise$_isFinal() {
    return ( this._bitField & IS_FINAL ) > 0;
};

Promise.prototype._isDelegated = function Promise$_isDelegated() {
    return ( this._bitField & IS_DELEGATED ) === IS_DELEGATED;
};

Promise.prototype._unsetDelegated = function Promise$_unsetDelegated() {
    this._bitField = this._bitField & ( ~IS_DELEGATED );
};

Promise.prototype._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | IS_CANCELLABLE;
};

Promise.prototype._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & ( ~IS_CANCELLABLE );
};

Promise.prototype._receiverAt = function Promise$_receiverAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );

    var ret;
    if( index === 0 ) {
        ret = this._receiver0;
    }
    else {
        ret = this[ index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE ];
    }
    //Only use the bound value when not calling internal methods
    if( this._isBound() && ret === void 0 ) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function Promise$_promiseAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._promise0;
    return this[ index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE ];
};

Promise.prototype._fulfillAt = function Promise$_fulfillAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._fulfill0;
    return this[ index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE ];
};

Promise.prototype._rejectAt = function Promise$_rejectAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._reject0;
    return this[ index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE ];
};

Promise.prototype._unsetAt = function Promise$_unsetAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) {
        this._fulfill0 =
        this._reject0 =
        this._progress0 =
        this._promise0 =
        this._receiver0 = void 0;
    }
    else {
        this[ index - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET ] =
        this[ index - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET ] =
        this[ index - CALLBACK_SIZE + CALLBACK_PROGRESS_OFFSET ] =
        this[ index - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET ] =
        this[ index - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET ] = void 0;
    }
};

Promise.prototype._resolveResolver =
function Promise$_resolveResolver( resolver ) {
    ASSERT( typeof resolver === "function" );
    this._setTrace( this._resolveResolver, void 0 );
    var p = new PromiseResolver( this );
    this._pushContext();
    var r = tryCatch2( resolver, this, function Promise$_fulfiller( val ) {
        p.fulfill( val );
    }, function Promise$_rejecter( val ) {
        p.reject( val );
    });
    this._popContext();
    if( r === errorObj ) {
        p.reject( r.e );
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

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._progress0 = progress;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength( index + CALLBACK_SIZE );
        return index;
    }

    this[ index - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET ] = fulfill;
    this[ index - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET ] = reject;
    this[ index - CALLBACK_SIZE + CALLBACK_PROGRESS_OFFSET ] = progress;
    this[ index - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET ] = promise;
    this[ index - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET ] = receiver;

    this._setLength( index + CALLBACK_SIZE );
    return index;
};

Promise.prototype._spreadSlowCase =
function Promise$_spreadSlowCase( targetFn, promise, values, boundTo ) {
    ASSERT( isArray( values ) || isPromise( values ) );
    ASSERT( typeof targetFn === "function" );
    ASSERT( isPromise( promise ) );
    promise._assumeStateOf(
            Promise$_All( values, PromiseArray, this._spreadSlowCase, boundTo )
            .promise()
            ._then( function() {
                return targetFn.apply( boundTo, arguments );
            }, void 0, void 0, APPLY, void 0,
                    this._spreadSlowCase ),
        MAY_SYNC
    );
};

Promise.prototype._setBoundTo = function Promise$_setBoundTo( obj ) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function Promise$_isBound() {
    return this._boundTo !== void 0;
};


var ignore = CatchFilter.prototype.doFilter;
Promise.prototype._resolvePromise = function Promise$_resolvePromise(
    onFulfilledOrRejected, receiver, value, promise
) {
    var isRejected = this.isRejected();

    if( isRejected &&
        typeof value === "object" &&
        value !== null ) {
        var handledState = value[ERROR_HANDLED_KEY];

        if( handledState === void 0 ) {
            notEnumerableProp( value, ERROR_HANDLED_KEY, ERROR_HANDLED );
        }
        else {
            value[ERROR_HANDLED_KEY] =
                withHandledMarked( handledState );
        }
    }

    //if promise is not instanceof Promise
    //it is internally smuggled data
    if( !isPromise( promise ) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x;
    //Special receiver that means we are .applying an array of arguments
    //(for .spread() at the moment)
    if( !isRejected && receiver === APPLY ) {
        //Array of non-promise values is fast case
        //.spread has a bit convoluted semantics otherwise
        if( isArray( value ) ) {
            //Shouldnt be many items to loop through
            //since the spread target callback will have
            //a formal parameter for each item in the array
            for( var i = 0, len = value.length; i < len; ++i ) {
                if( isPromise( value[i] ) ) {
                    this._spreadSlowCase(
                        onFulfilledOrRejected,
                        promise,
                        value,
                        this._boundTo
                    );
                    return;
                }
            }
            promise._pushContext();
            x = tryCatchApply( onFulfilledOrRejected, value, this._boundTo );
        }
        else {
            //(TODO) Spreading a promise that eventually returns
            //an array could be a common usage
            this._spreadSlowCase( onFulfilledOrRejected, promise,
                    value, this._boundTo );
            return;
        }
    }
    else {
        promise._pushContext();
        x = tryCatch1( onFulfilledOrRejected, receiver, value );
    }

    promise._popContext();

    if( x === errorObj ) {
        ensureNotHandled(x.e);
        if( onFulfilledOrRejected !== ignore ) {
            promise._attachExtraTrace( x.e );
        }
        async.invoke( promise._reject, promise, x.e );
    }
    else if( x === promise ) {
        var selfResolutionError =
            new TypeError( "Circular thenable chain" );
        this._attachExtraTrace( selfResolutionError );
        async.invoke(
            promise._reject,
            promise,
            //1. If promise and x refer to the same object,
            //reject promise with a TypeError as the reason.
            selfResolutionError
        );
    }
    else {
        if( promise._tryAssumeStateOf( x, MUST_ASYNC ) ) {
            //2. If x is a promise, adopt its state
            return;
        }
        //3. Otherwise, if x is an object or function,
        else if( Promise._couldBeThenable( x ) ) {

            if( promise._length() === 0 ) {
                promise._resolvedValue = x;
                promise._setDelegated();
                return;
            }
            else if( promise._tryThenable( x ) ) {
                return;
            }
        }
        // 3.4 If then is not a function, fulfill promise with x.
        // 4. If x is not an object or function, fulfill promise with x.
        async.invoke( promise._fulfill, promise, x );
    }
};

Promise.prototype._assumeStateOf =
function Promise$_assumeStateOf( promise, mustAsync ) {
    ASSERT( isPromise( promise ) );
    ASSERT( mustAsync === MUST_ASYNC || mustAsync === MAY_SYNC );
    ASSERT( this._isFollowingOrFulfilledOrRejected() === false );
    this._setFollowing();
    if( promise.isPending() ) {
        if( promise._cancellable()  ) {
            this._cancellationParent = promise;
        }
        promise._then(
            this._resolveFulfill,
            this._resolveReject,
            this._resolveProgress,
            this,
            void 0, //TODO: is it necessary to go full paths
            this._tryAssumeStateOf
        );
    }
    else if( promise.isFulfilled() ) {
        if( mustAsync === MUST_ASYNC )
            async.invoke( this._resolveFulfill, this, promise._resolvedValue );
        else
            this._resolveFulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync === MUST_ASYNC )
            async.invoke( this._resolveReject, this, promise._resolvedValue );
        else
            this._resolveReject( promise._resolvedValue );
    }

    if( longStackTraces &&
        promise._traceParent == null ) {
        promise._traceParent = this;
    }
};

Promise.prototype._tryAssumeStateOf =
function Promise$_tryAssumeStateOf( value, mustAsync ) {
    if( !isPromise( value ) ||
        this._isFollowingOrFulfilledOrRejected() ) return false;

    this._assumeStateOf( value, mustAsync );
    return true;
};

Promise.prototype._setTrace = function Promise$_setTrace( caller, parent ) {
    ASSERT( this._trace == null );
    if( longStackTraces ) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        if( parent !== void 0 &&
            parent._traceParent === context ) {
            ASSERT( parent._trace != null );
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
function Promise$_attachExtraTrace( error ) {
    if( longStackTraces &&
        canAttach( error ) ) {
        var promise = this;
        var stack = error.stack;
        stack = typeof stack === "string"
            ? stack.split("\n") : [];
        var headerLineCount = 1;

        while( promise != null &&
            promise._trace != null ) {
            stack = CapturedTrace.combine(
                stack,
                promise._trace.stack.split( "\n" )
            );
            promise = promise._traceParent;
        }

        var max = Error.stackTraceLimit + headerLineCount;
        var len = stack.length;
        if( len  > max ) {
            stack.length = max;
        }
        if( stack.length <= headerLineCount ) {
            error.stack = "(No stack trace)";
        }
        else {
            error.stack = stack.join("\n");
        }
        error[ERROR_HANDLED_KEY] =
            withStackAttached( error[ERROR_HANDLED_KEY] );
    }
};

Promise.prototype._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection( reason ) {
    if( !isHandled( reason[ERROR_HANDLED_KEY] ) ) {
        reason[ERROR_HANDLED_KEY] =
            withHandledMarked( reason[ERROR_HANDLED_KEY] );
        CapturedTrace.possiblyUnhandledRejection( reason, this );
    }
};

Promise.prototype._unhandledRejection =
function Promise$_unhandledRejection( reason ) {
    if( !isHandled( reason[ERROR_HANDLED_KEY] ) ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

Promise.prototype._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

Promise.prototype._fulfill = function Promise$_fulfill( value ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveFulfill( value );

};

Promise.prototype._reject = function Promise$_reject( reason ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveReject( reason );
};

Promise.prototype._doResolveAt = function Promise$_doResolveAt( i ) {
    var fn = this.isFulfilled()
        ? this._fulfillAt( i )
        : this._rejectAt( i );
    ASSERT( this.isFulfilled() || this.isRejected() );
    ASSERT( typeof fn === "function" );
    var value = this._resolvedValue;
    var receiver = this._receiverAt( i );
    var promise = this._promiseAt( i );
    this._unsetAt( i );
    this._resolvePromise( fn, receiver, value, promise );
};

Promise.prototype._resolveFulfill = function Promise$_resolveFulfill( value ) {
    ASSERT( this.isPending() );
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    var len = this._length();
    this._setLength( 0 );
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        if( this._fulfillAt( i ) !== void 0 ) {
            ASSERT( typeof this._fulfillAt( i ) === "function");
            async.invoke( this._doResolveAt, this, i );
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            async.invoke( promise._fulfill, promise, value );
        }
    }

};

Promise.prototype._resolveLast = function Promise$_resolveLast( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    this._setLength( 0 );
    var fn;
    ASSERT( this.isFulfilled() || this.isRejected() );
    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else {
        fn = this._rejectAt( index );
    }

    if( fn !== void 0 ) {
        ASSERT( typeof fn === "function" );
        async.invoke( this._doResolveAt, this, index );
    }
    else {
        var promise = this._promiseAt( index );
        var value = this._resolvedValue;
        this._unsetAt( index );
        if( this.isFulfilled() ) {
            async.invoke( promise._fulfill, promise, value );
        }
        else {
            async.invoke( promise._reject, promise, value );
        }
    }

};

Promise.prototype._resolveReject = function Promise$_resolveReject( reason ) {
    ASSERT( this.isPending() );
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = reason;
    if( this._isFinal() ) {
        ASSERT( this._length() === 0 );
        //Currently not in conflict with anything but should
        //invokeLater be used for something else, this needs to be revisited
        async.invokeLater( thrower, void 0, reason );
        return;
    }
    var len = this._length();
    this._setLength( 0 );
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        if( this._rejectAt( i ) !== void 0 ) {
            rejectionWasHandled = true;
            async.invoke( this._doResolveAt, this, i );
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            if( !rejectionWasHandled )
                rejectionWasHandled = promise._length() > 0;
            async.invoke( promise._reject, promise, reason );
        }
    }

    if( !rejectionWasHandled &&
        CapturedTrace.possiblyUnhandledRejection !== void 0
    ) {

        if( isObject( reason ) ) {
            var handledState = reason[ERROR_HANDLED_KEY];
            var newReason = reason;

            if( handledState === void 0 ) {
                newReason = ensurePropertyExpansion(reason,
                    ERROR_HANDLED_KEY, DEFAULT_STATE );
                handledState = DEFAULT_STATE;
            }
            else if( isHandled( handledState ) ) {
                return;
            }

            if( !isStackAttached( handledState ) )  {
                this._attachExtraTrace( newReason );
            }
            async.invoke( this._unhandledRejection, this, newReason );

        }
    }

};

var contextStack = [];
Promise.prototype._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if( lastIndex >= 0 ) {
        return contextStack[ lastIndex ];
    }
    return void 0;

};

Promise.prototype._pushContext = function Promise$_pushContext() {
    if( !longStackTraces ) return;
    contextStack.push( this );
};

Promise.prototype._popContext = function Promise$_popContext() {
    if( !longStackTraces ) return;
    contextStack.pop();
};


function Promise$_All( promises, PromiseArray, caller, boundTo ) {
    ASSERT( arguments.length === 4 );
    ASSERT( typeof PromiseArray === "function" );
    if( isPromise( promises ) ||
        isArray( promises ) ) {

        return new PromiseArray(
            promises,
            typeof caller === "function"
                ? caller
                : Promise$_All,
            boundTo
        );
    }
    return new PromiseArray(
        [ apiRejection( "expecting an array or a promise" ) ],
        caller,
        boundTo
    );
}

var old = global.Promise;

Promise.noConflict = function() {
    if( global.Promise === Promise ) {
        global.Promise = old;
    }
    return Promise;
};

if( !CapturedTrace.isSupported() ) {
    Promise.longStackTraces = function(){};
    CapturedTrace.possiblyUnhandledRejection = function(){};
    Promise.onPossiblyUnhandledRejection = function(){};
    longStackTraces = false;
}

Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;
Promise.RejectionError = RejectionError;
};
