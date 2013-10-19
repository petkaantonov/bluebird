var Promise = (function() {

function isObject( value ) {
    if( value === null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" );
}

function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

var isArray = Array.isArray || function( obj ) {
    return obj instanceof Array;
};


var APPLY = {};
var thenable = new Thenable( errorObj );

CONSTANT(USE_BOUND, true);
CONSTANT(DONT_USE_BOUND, false);

CONSTANT(CALLBACK_FULFILL_OFFSET, 0);
CONSTANT(CALLBACK_REJECT_OFFSET, 1);
CONSTANT(CALLBACK_PROGRESS_OFFSET, 2);
CONSTANT(CALLBACK_PROMISE_OFFSET, 3);
CONSTANT(CALLBACK_RECEIVER_OFFSET, 4);
CONSTANT(CALLBACK_SIZE, 5);

//Layout for .bitField
//DDWF NCTR LLLL LLLL LLLL LLLL LLLL LLLL
//D = isDelegated - To implement just in time thenable assimilation
//Both of the DD bits must be either 0 or 1
//W = isFollowing (The promise that is being followed is not stored explicitly)
//F = isFulfilled
//N = isRejected
//C = isCancellable
//T = isFinal (used for .done() implementation)

//R = [Reserved]
//L = Length, 24 bit unsigned
CONSTANT(IS_DELEGATED, 0xC0000000|0);
CONSTANT(IS_FOLLOWING, 0x20000000|0);
CONSTANT(IS_FULFILLED, 0x10000000|0);
CONSTANT(IS_REJECTED, 0x8000000|0);
CONSTANT(IS_CANCELLABLE, 0x4000000|0);
CONSTANT(IS_FINAL, 0x2000000|0);
CONSTANT(LENGTH_MASK, 0xFFFFFF|0);
CONSTANT(LENGTH_CLEAR_MASK, ~LENGTH_MASK);
CONSTANT(MAX_LENGTH, LENGTH_MASK);
CONSTANT(IS_REJECTED_OR_FULFILLED, IS_REJECTED | IS_FULFILLED);
CONSTANT(IS_FOLLOWING_OR_REJECTED_OR_FULFILLED, IS_REJECTED_OR_FULFILLED | IS_FOLLOWING);

/**
 * Description.
 *
 *
 */
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
    ret._assumeStateOf( this, true );
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
            if( typeof item === "function" &&
                ( item.prototype instanceof Error ||
                item === Error ) ) {
                catchInstances[j++] = item;
            }
            else {
                var catchFilterTypeError =
                    new TypeError(
                        "A catch filter must be an error constructor");

                this._attachExtraTrace( catchFilterTypeError );
                async.invoke( this._reject, this, catchFilterTypeError );
                return;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter( catchInstances, fn, this._boundTo );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
};

/**
 * Convenience Promise.prototype for .then( null, null, fn );
 *
 * @param {Function} fn The callback to call if this promise is progressed
 * @return {Promise}
 */
Promise.prototype.progressed = function Promise$progressed( fn ) {
    return this._then( void 0, void 0, fn, void 0, void 0, this.progressed );
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
 * Synchronously inspect the state of this promise. Returns
 * A snapshot reflecting this promise's state exactly at the time of
 * call.
 *
 * If this promise is resolved, the inspection can be used to gain
 * access to this promise's rejection reason or fulfillment value
 * synchronously.
 *
 * (TODO) Based on inspection spec
 *
 * @return {PromiseInspection}
 */
Promise.prototype.inspect = function Promise$inspect() {
    return new PromiseInspection( this );
};

/**
 * Cancel this promise. The cancellation will propagate
 * to farthest ancestor promise which is still pending.
 *
 * That ancestor will then be rejected with a CancellationError
 * object as the rejection reason.
 *
 * In a promise rejection handler you may check for a cancellation
 * by seeing if the reason object has `.name === "Cancel"`.
 *
 * Promises are by default cancellable. If you want to restrict
 * the cancellability of a promise before handing it out to a
 * client, call `.uncancellable()` which returns an uncancellable
 * promise.
 *
 * (TODO) Based on cancellation spec.
 *
 * @return {Promise}
 */
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

/**
 * Create an uncancellable promise based on this promise
 *
 * @return {Promise}
 */
Promise.prototype.uncancellable = function Promise$uncancellable() {
    var ret = new Promise();
    ret._setTrace( this.uncancellable, this );
    ret._unsetCancellable();
    ret._assumeStateOf( this, true );
    ret._boundTo = this._boundTo;
    return ret;
};

/**
 * Like .then, but cancellation of the the returned promise
 * or any of its descendant will not propagate cancellation
 * to this promise or this promise's ancestors.
 *
 * @param {=Function} didFulfill The callback to call if this promise
 *  is fulfilled.
 * @param {=Function} didReject The callback to call if this promise
 *  is rejected.
 * @param {=Function} didProgress The callback to call if this promise is
 *  notified of progress.
 * @return {Promise}
 */
Promise.prototype.fork =
function Promise$fork( didFulfill, didReject, didProgress ) {
    var ret = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.fork );
    ret._cancellationParent = void 0;
    return ret;
};

/**
 *
 * @param {string} propertyName The property to call as a function.
 * @return {Promise}
 *
 */
Promise.prototype.call = function Promise$call( propertyName ) {
    var len = arguments.length;

    var args = new Array(len-1);
    for( var i = 1; i < len; ++i ) {
        args[ i - 1 ] = arguments[ i ];
    }

    return this._then( function( obj ) {
            return obj[ propertyName ].apply( obj, args );
        },
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

/**
 *
 * @param {string} propertyName The property to retrieve.
 * @return {Promise}
 *
 */

function Promise$getter( obj ) {
    var prop = typeof this === "string"
        ? this
        : ("" + this);
    return obj[ prop ];
}
Promise.prototype.get = function Promise$get( propertyName ) {
    return this._then(
        Promise$getter,
        void 0,
        void 0,
        propertyName,
        void 0,
        this.get
    );
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

/**
 * For JSON serialization.
 *
 * @return {dynamic}
 */
Promise.prototype.toJSON = function Promise$toJSON() {
    var inspection = this.inspect();
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: void 0,
        rejectionReason: void 0
    };
    if( inspection.isFulfilled() ) {
        ret.fulfillmentValue = inspection.value();
        ret.isFulfilled = true;
    }
    else if( inspection.isRejected() ) {
        ret.rejectionReason = inspection.error();
        ret.isRejected = true;
    }
    return ret;
};

function Promise$_successAdapter( val, receiver ) {
    var nodeback = this;
    ASSERT( typeof nodeback == "function" );
    var ret = tryCatch2( nodeback, receiver, null, val );
    if( ret === errorObj ) {
        async.invokeLater( thrower, void 0, ret.e );
    }
}
function Promise$_errorAdapter( reason, receiver ) {
    var nodeback = this;
    ASSERT( typeof nodeback == "function" );
    var ret = tryCatch1( nodeback, receiver, reason );
    if( ret === errorObj ) {
        async.invokeLater( thrower, void 0, ret.e );
    }
}

/**
 * Description.
 *
 *
 */
Promise.prototype.nodeify = function Promise$nodeify( nodeback ) {
    if( typeof nodeback == "function" ) {
        this._then(
            Promise$_successAdapter,
            Promise$_errorAdapter,
            void 0,
            nodeback,
            this._isBound() ? this._boundTo : null,
            this.nodeify
        );
    }
    return this;
};

function apiRejection( msg ) {
    var error = new TypeError( msg );
    var ret = Promise.rejected( error );
    var parent = ret._peekContext();
    if( parent != null ) {
        parent._attachExtraTrace( error );
    }
    return ret;
}

/**
 * Description.
 *
 *
 */

Promise.prototype.map = function Promise$map( fn ) {
    return Promise$_Map( this, fn, USE_BOUND, this.map );
};


/**
 * Description.
 *
 *
 */
Promise.prototype.filter = function Promise$filter( fn ) {
    return Promise$_Filter( this, fn, USE_BOUND, this.filter );
};

/**
 * Description.
 *
 *
 */
Promise.prototype.all = function Promise$all() {
    return Promise$_all( this, USE_BOUND, this.all );
};

/**
 * Description.
 *
 *
 */
Promise.prototype.any = function Promise$any() {
    return Promise$_Any( this, USE_BOUND, this.any );
};

/**
 * Description.
 *
 *
 */
Promise.prototype.settle = function Promise$settle() {
    return Promise$_Settle( this, USE_BOUND, this.settle );
};

/**
 * Description.
 *
 *
 */
Promise.prototype.some = function Promise$some( count ) {
    return Promise$_Some( this, count, USE_BOUND, this.some );
};

/**
 * Description.
 *
 *
 */
Promise.prototype.reduce = function Promise$reduce( fn, initialValue ) {
    return Promise$_Reduce( this, fn, initialValue, USE_BOUND, this.reduce );
};

/**
 * Description.
 *
 *
 */
 Promise.prototype.props = function Promise$props() {
    return Promise$_Props( this, USE_BOUND, this.props );
 };

/**
 * See if obj is a promise from this library. Same
 * as calling `obj instanceof Promise`.
 *
 * @param {dynamic} obj The object to check.
 * @return {boolean}
 */
Promise.is = isPromise;

function Promise$_Settle( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        SettledPromiseArray,
        caller,
        useBound === USE_BOUND ? promises._boundTo : void 0
    ).promise();
}
Promise.settle = function Promise$Settle( promises ) {
    return Promise$_Settle( promises, DONT_USE_BOUND, Promise.settle );
};

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

function Promise$_Props( promises, useBound, caller ) {
    var ret;
    if( isPrimitive( promises ) ) {
        ret = Promise.fulfilled( promises, caller );
    }
    else if( isPromise( promises ) ) {
        ret = promises._then( Promise.props, void 0, void 0,
                        void 0, void 0, caller );
    }
    else {
        ret = new PropertiesPromiseArray(
            promises,
            caller,
            useBound === USE_BOUND ? promises._boundTo : void 0
        ).promise();
        //The constructor took care of it
        useBound = DONT_USE_BOUND;
    }
    if( useBound === USE_BOUND ) {
        ret._boundTo = promises._boundTo;
    }
    return ret;
}

Promise.props = function Promise$Props( promises ) {
    return Promise$_Props( promises, DONT_USE_BOUND, Promise.props );
};

Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise$_All( ret, PromiseArray, Promise.join, void 0 ).promise();
};

function Promise$_Any( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        AnyPromiseArray,
        caller,
        useBound === USE_BOUND ? promises._boundTo : void 0
    ).promise();
}
Promise.any = function Promise$Any( promises ) {
    return Promise$_Any( promises, DONT_USE_BOUND, Promise.any );
};

function Promise$_Some( promises, howMany, useBound, caller ) {
    if( ( howMany | 0 ) !== howMany ) {
        return apiRejection("howMany must be an integer");
    }
    var ret = Promise$_All(
        promises,
        SomePromiseArray,
        caller,
        useBound === USE_BOUND ? promises._boundTo : void 0
    );
    ASSERT( ret instanceof SomePromiseArray );
    ret.setHowMany( howMany );
    return ret.promise();
}
Promise.some = function Promise$Some( promises, howMany ) {
    return Promise$_Some( promises, howMany, DONT_USE_BOUND, Promise.some );
};


function Promise$_mapper( fulfilleds ) {
    var fn = this;
    var receiver = void 0;

    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    ASSERT( typeof fn === "function" );
    var shouldDefer = false;

    if( receiver === void 0 ) {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            var fulfill = fn( fulfilleds[ i ], i, len );
            if( !shouldDefer && isPromise( fulfill ) ) {
                if( fulfill.isFulfilled() ) {
                    fulfilleds[i] = fulfill._resolvedValue;
                    continue;
                }
                else {
                    shouldDefer = true;
                }
            }
            fulfilleds[i] = fulfill;
        }
    }
    else {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            var fulfill = fn.call( receiver, fulfilleds[ i ], i, len );
            if( !shouldDefer && isPromise( fulfill ) ) {
                if( fulfill.isFulfilled() ) {
                    fulfilleds[i] = fulfill._resolvedValue;
                    continue;
                }
                else {
                    shouldDefer = true;
                }
            }
            fulfilleds[i] = fulfill;
        }
    }
    return shouldDefer
        ? Promise$_All( fulfilleds, PromiseArray,
            Promise$_mapper, void 0 ).promise()
        : fulfilleds;
}

function Promise$_Map( promises, fn, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === USE_BOUND ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === USE_BOUND ? promises._boundTo : void 0
    ).promise()
    ._then(
        Promise$_mapper,
        void 0,
        void 0,
        fn,
        void 0,
        caller
    );


}
Promise.map = function Promise$Map( promises, fn ) {
    return Promise$_Map( promises, fn, DONT_USE_BOUND, Promise.map );
};

function Promise$_reducer( fulfilleds, initialValue ) {
    var fn = this;
    var receiver = void 0;
    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    ASSERT( typeof fn === "function" );
    var len = fulfilleds.length;
    var accum = void 0;
    var startIndex = 0;

    if( initialValue !== void 0 ) {
        accum = initialValue;
        startIndex = 0;
    }
    else {
        startIndex = 1;
        if( len > 0 ) {
            for( var i = 0; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fulfilleds[i];
                startIndex = i + 1;
                break;
            }
        }
    }
    if( receiver === void 0 ) {
        for( var i = startIndex; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            accum = fn( accum, fulfilleds[i], i, len );
        }
    }
    else {
        for( var i = startIndex; i < len; ++i ) {
            if( fulfilleds[i] === void 0 &&
                !(i in fulfilleds) ) {
                continue;
            }
            accum = fn.call( receiver, accum, fulfilleds[i], i, len );
        }
    }
    return accum;
}

function Promise$_unpackReducer( fulfilleds ) {
    var fn = this.fn;
    var initialValue = this.initialValue;
    return Promise$_reducer.call( fn, fulfilleds, initialValue );
}

function Promise$_slowReduce( promises, fn, initialValue, useBound, caller ) {
    return initialValue._then( function callee( initialValue ) {
        return Promise$_Reduce( promises, fn, initialValue, useBound, callee );
    }, void 0, void 0, void 0, void 0, caller);
}

function Promise$_Reduce( promises, fn, initialValue, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === USE_BOUND ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    if( initialValue !== void 0 ) {
        if( isPromise( initialValue ) ) {
            if( initialValue.isFulfilled() ) {
                initialValue = initialValue._resolvedValue;
            }
            else {
                return Promise$_slowReduce( promises,
                    fn, initialValue, useBound, caller );
            }
        }

        return Promise$_All( promises, PromiseArray, caller,
            useBound === USE_BOUND ? promises._boundTo : void 0 )
            .promise()
            ._then( Promise$_unpackReducer, void 0, void 0, {
                fn: fn,
                initialValue: initialValue
            }, void 0, Promise.reduce );
    }
    return Promise$_All( promises, PromiseArray, caller,
            useBound === USE_BOUND ? promises._boundTo : void 0 ).promise()
        //Currently smuggling internal data has a limitation
        //in that no promises can be chained after it.
        //One needs to be able to chain to get at
        //the reduced results, so fast case is only possible
        //when there is no initialValue.
        ._then( Promise$_reducer, void 0, void 0, fn, void 0, caller );
}

Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
    return Promise$_Reduce( promises, fn,
        initialValue, DONT_USE_BOUND, Promise.reduce);
};

function Promise$_filterer( fulfilleds ) {
    var fn = this;
    var receiver = void 0;
    if( typeof fn !== "function" )  {
        receiver = fn.receiver;
        fn = fn.fn;
    }
    ASSERT( typeof fn === "function" );
    var ret = new Array( fulfilleds.length );
    var j = 0;
    if( receiver === void 0 ) {
         for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            var item = fulfilleds[i];
            if( item === void 0 &&
                !( i in fulfilleds ) ) {
                continue;
            }
            if( fn( item, i, len ) ) {
                ret[j++] = item;
            }
        }
    }
    else {
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            var item = fulfilleds[i];
            if( item === void 0 &&
                !( i in fulfilleds ) ) {
                continue;
            }
            if( fn.call( receiver, item, i, len ) ) {
                ret[j++] = item;
            }
        }
    }
    ret.length = j;
    return ret;
}

function Promise$_Filter( promises, fn, useBound, caller ) {
    if( typeof fn !== "function" ) {
        return apiRejection( "fn is not a function" );
    }

    if( useBound === USE_BOUND ) {
        fn = {
            fn: fn,
            receiver: promises._boundTo
        };
    }

    return Promise$_All( promises, PromiseArray, caller,
            useBound === USE_BOUND ? promises._boundTo : void 0 )
        .promise()
        ._then( Promise$_filterer, void 0, void 0, fn, void 0, caller );
}

Promise.filter = function Promise$Filter( promises, fn ) {
    return Promise$_Filter( promises, fn, DONT_USE_BOUND, Promise.filter );
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
    if( ret._tryAssumeStateOf( value, false ) ) {
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


/**
 * Casts the object to a trusted Promise. If the
 * object is a "thenable", then the trusted promise will
 * assimilate it. Otherwise the trusted promise is immediately
 * fulfilled with obj as the fulfillment value.
 *
 * It is recommended to use just one promise library at a time,
 * so you don't have to call this Promise.prototype.
 *
 * Example: ($ is jQuery)
 *
 * Promise.cast($.get("http://www.google.com")).catch(function(){
 *     //will catch to same-origin policy error here..
 *     //... unless you are running this on google website
 * });
 *
 * Note that if you return an untrusted promise inside a then e.g.:
 *
 * somePromise.then(function(url) {
 *     return $.get(url);
 * });
 *
 * Then the returned untrusted promise is autocast per Promises/A+
 * specification. In any other situation, you will need to use
 * explicit casting through Promise.cast
 *
 * @param {dynamic} obj The object to cast to a trusted Promise
 * @return {Promise}
 *
 */
Promise._cast = cast;
Promise.cast = function Promise$Cast( obj, caller ) {
    var ret = cast( obj, caller );
    if( !( ret instanceof Promise ) ) {
        return Promise.fulfilled( ret, caller );
    }
    return ret;
};

Promise["try"] = Promise.attempt = function( fn ) {
    return Promise.fulfilled().then( fn );
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

Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
     if( typeof generatorFunction !== "function" ) {
        throw new TypeError( "generatorFunction must be a function" );
    }
    //(TODO) Check if v8 traverses the contexts or inlines the context slot
    //location depending on this
    var PromiseSpawn$ = PromiseSpawn;
    return function anonymous() {
        var generator = generatorFunction.apply( this, arguments );
        var spawn = new PromiseSpawn$( void 0, void 0, anonymous );
        spawn._generator = generator;
        spawn._next( void 0 );
        return spawn.promise();
    };
};

Promise.spawn = function Promise$Spawn( generatorFunction ) {
    if( typeof generatorFunction !== "function" ) {
        return apiRejection( "generatorFunction must be a function" );
    }
    var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
    var ret = spawn.promise();
    spawn._run( Promise.spawn );
    return ret;
};

var longStackTraces = __DEBUG__;
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

/**
 * Description.
 *
 *
 */
function f(){}
function isPromisified( fn ) {
    return fn.__isPromisified__ === true;
}
var hasProp = {}.hasOwnProperty;
CONSTANT(BEFORE_PROMISIFIED_SUFFIX, "__beforePromisified__");
CONSTANT(AFTER_PROMISIFIED_SUFFIX, "Async");
var roriginal = new RegExp( BEFORE_PROMISIFIED_SUFFIX + "$" );
function _promisify( callback, receiver, isAll ) {
    if( isAll ) {
        var changed = 0;
        var o = {};
        for( var key in callback ) {
            if( !roriginal.test( key ) &&
                !hasProp.call( callback,
                    ( key + BEFORE_PROMISIFIED_SUFFIX ) ) &&
                typeof callback[ key ] === "function" ) {
                var fn = callback[key];
                if( !isPromisified( fn ) ) {
                    changed++;
                    var originalKey = key + BEFORE_PROMISIFIED_SUFFIX;
                    var promisifiedKey = key + AFTER_PROMISIFIED_SUFFIX;
                    notEnumerableProp( callback, originalKey, fn );
                    o[ promisifiedKey ] =
                        makeNodePromisified( originalKey, THIS, key );
                }
            }
        }
        if( changed > 0 ) {
            for( var key in o ) {
                if( hasProp.call( o, key ) ) {
                    callback[key] = o[key];
                }
            }
            //Right now the above loop will easily turn the
            //object into hash table in V8
            //but this will turn it back. Yes I am ashamed.
            f.prototype = callback;
        }

        return callback;
    }
    else {
        return makeNodePromisified( callback, receiver, void 0 );
    }
}
Promise.promisify = function Promise$Promisify( callback, receiver ) {
    if( typeof callback === "object" && callback !== null ) {
        deprecated( "Promise.promisify for promisifying entire objects " +
            "is deprecated. Use Promise.promisifyAll instead." );
        return _promisify( callback, receiver, true );
    }
    if( typeof callback !== "function" ) {
        throw new TypeError( "callback must be a function" );
    }
    if( isPromisified( callback ) ) {
        return callback;
    }
    return _promisify(
        callback,
        arguments.length < 2 ? THIS : receiver,
        false );
};

Promise.promisifyAll = function Promise$PromisifyAll( target ) {
    if( typeof target !== "function" && typeof target !== "object" ) {
        throw new TypeError( "Cannot promisify " + typeof target );
    }
    return _promisify( target, void 0, true );
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

Promise.prototype._progressAt = function Promise$_progressAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._progress0;
    return this[ index + CALLBACK_PROGRESS_OFFSET - CALLBACK_SIZE ];
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
        false
    );
};

Promise.prototype._setBoundTo = function Promise$_setBoundTo( obj ) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function Promise$_isBound() {
    return this._boundTo !== void 0;
};


function cast( obj, caller ) {
    if( isObject( obj ) ) {
        if( obj instanceof Promise ) {
            return obj;
        }
        var ref = { ref: null, promise: null };
        if( thenable.is( obj, ref ) ) {
            if( ref.promise != null ) {
                return ref.promise;
            }
            var resolver = Promise.pending( caller );
            var result = ref.ref;
            if( result === errorObj ) {
                resolver.reject( result.e );
                return resolver.promise;
            }
            thenable.addCache( obj, resolver.promise );
            var called = false;
            var ret = tryCatch2( result, obj, function t( a ) {
                if( called ) return;
                called = true;
                async.invoke( thenable.deleteCache, thenable, obj );
                var b = cast( a );
                if( b === a ) {
                    resolver.fulfill( a );
                }
                else {
                    if( a === obj ) {
                        ASSERT( resolver.promise.isPending() );
                        resolver.promise._resolveFulfill( a );
                    }
                    else {
                        b._then(
                            resolver.fulfill,
                            resolver.reject,
                            void 0,
                            resolver,
                            void 0,
                            t
                        );
                    }
                }
            }, function t( a ) {
                if( called ) return;
                called = true;
                async.invoke( thenable.deleteCache, thenable, obj );
                resolver.reject( a );
            });
            if( ret === errorObj && !called ) {
                resolver.reject( ret.e );
                async.invoke( thenable.deleteCache, thenable, obj );
            }
            return resolver.promise;
        }
    }
    return obj;
}

Promise.prototype._resolveThenable =
function Promise$_resolveThenable( x, ref ) {
    if( ref.promise != null ) {
        this._assumeStateOf( ref.promise, true );
        return;
    }
     //3.2 If retrieving the property x.then
    //results in a thrown exception e,
    //reject promise with e as the reason.
    if( ref.ref === errorObj ) {
        this._attachExtraTrace( ref.ref.e );
        async.invoke( this._reject, this, ref.ref.e );
    }
    else {
        thenable.addCache( x, this );
        //3.1. Let then be x.then
        var then = ref.ref;
        var localX = x;
        var localP = this;
        var key = {};
        var called = false;
        //3.3 If then is a function, call it with x as this,
        //first argument resolvePromise, and
        //second argument rejectPromise
        var t = function t( v ) {
            if( called && this !== key ) return;
            called = true;
            var fn = localP._fulfill;
            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    //Thenable used itself as the value
                    async.invoke( fn, localP, v );
                    async.invoke( thenable.deleteCache, thenable, localX );
                }
                else {
                    b._then( t, r, void 0, key, void 0, t);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                ASSERT( b.isResolved() );
                v = v._resolvedValue;
                b = cast( v );
                ASSERT( b instanceof Promise || b === v );
                if( b !== v ||
                    ( b instanceof Promise && b !== v ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }
            async.invoke( fn, localP, v );
            async.invoke( thenable.deleteCache,
                    thenable, localX );
        };

        var r = function r( v ) {
            if( called && this !== key ) return;
            var fn = localP._reject;
            called = true;

            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                if( v === x ) {
                    //Thenable used itself as the reason
                    async.invoke( fn, localP, v );
                    async.invoke( thenable.deleteCache, thenable, localX );
                }
                else {
                    b._then( t, r, void 0, key, void 0, t);
                }
                return;
            }


            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                ASSERT( b.isResolved() );
                v = v._resolvedValue;
                b = cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }

            async.invoke( fn, localP, v );
            async.invoke( thenable.deleteCache,
                thenable, localX );

        };
        var threw = tryCatch2( then, x, t, r);
        //3.3.4 If calling then throws an exception e,
        if( threw === errorObj &&
            !called ) {
            this._attachExtraTrace( threw.e );
            //3.3.4.2 Otherwise, reject promise with e as the reason.
            async.invoke( this._reject, this, threw.e );
            async.invoke( thenable.deleteCache, thenable, x );
        }
    }
};

Promise.prototype._tryThenable = function Promise$_tryThenable( x ) {
    var ref;
    if( !thenable.is( x, ref = {ref: null, promise: null} ) ) {
        return false;
    }
    this._resolveThenable( x, ref );
    return true;
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
        if( promise._tryAssumeStateOf( x, true ) ) {
            //2. If x is a promise, adopt its state
            return;
        }
        //3. Otherwise, if x is an object or function,
        else if( thenable.couldBe( x ) ) {

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
    ASSERT( typeof mustAsync === "boolean" );
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
        if( mustAsync )
            async.invoke( this._resolveFulfill, this, promise._resolvedValue );
        else
            this._resolveFulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync )
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

Promise.prototype._progress = function Promise$_progress( progressValue ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveProgress( progressValue );

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

Promise.prototype._resolveProgress =
function Promise$_resolveProgress( progressValue ) {
    ASSERT( this.isPending() );
    var len = this._length();
    for( var i = 0; i < len; i += CALLBACK_SIZE ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        //if promise is not instanceof Promise
        //it is internally smuggled data
        if( !isPromise( promise ) ) {
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
                    //with a name property equal to 'StopProgressPropagation',
                    // the result of the function is used as the progress
                    //value to propagate.
                    promise._attachExtraTrace( ret.e );
                    async.invoke( promise._progress, promise, ret.e );
                }
            }
            //2.2 The onProgress callback may return a promise.
            else if( isPromise( ret ) ) {
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

return Promise;})();
