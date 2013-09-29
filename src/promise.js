var Promise = (function() {

function isObject( value ) {
    //no need to check for undefined twice
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

var Err = Error;
function isError( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Err;
}

var Arr = Array;
var isArray = Arr.isArray || function( obj ) {
    return obj instanceof Arr;
};


var APPLY = {};
var thenable = new Thenable( errorObj );

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
    if( typeof resolver === "function" )
        this._resolveResolver( resolver );


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
    if( longStackTraces ) this._traceParent = this._peekContext();
}

var method = Promise.prototype;

var longStackTraces = __DEBUG__;
Promise.longStackTraces = function() {
    if( async.haveItemsQueued() &&
        longStackTraces === false
    ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

method._setTrace = function _setTrace( fn ) {
    ASSERT( this._trace == null );
    if( longStackTraces ) {
        this._trace = new CapturedTrace(
            typeof fn === "function"
            ? fn
            : _setTrace
        );
    }
    return this;
};

/**
 * @return {string}
 */
method.toString = function Promise$toString() {
    return "[object Promise]";
};


/**
 * Convenience method for .then( null, fn, null );
 *
 * @param {Function} fn The callback to call if this promise is rejected
 * @return {Promise}
 */
method.caught = method["catch"] = function Promise$catch( fn ) {
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
                throw new TypeError(
                    "A catch filter must be an error constructor"
                );
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter( catchInstances, fn );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
};

/**
 * Convenience method for .then( null, null, fn );
 *
 * @param {Function} fn The callback to call if this promise is progressed
 * @return {Promise}
 */
method.progressed = function Promise$progressed( fn ) {
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
method.lastly = method["finally"] = function Promise$finally( fn ) {
    var r = function( reasonOrValue ) {
        var ret = fn( reasonOrValue );
        if( isPromise( ret ) ) {
            return slowFinally.call( this, ret, reasonOrValue );
        }
        if( this.isRejected() ) throw reasonOrValue;
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
method.inspect = function Promise$inspect() {
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
method.cancel = function Promise$cancel() {
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
        async.invoke( this._reject, this, err );
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
method.uncancellable = function Promise$uncancellable() {
    var ret = new Promise();
    ret._setTrace( this.uncancellable );
    ret._unsetCancellable();
    ret._assumeStateOf( this, true );
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
method.fork = function Promise$fork( didFulfill, didReject, didProgress ) {
    var ret = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.fork );
    ret._cancellationParent = void 0;
    return ret;
};

/**
 * Chain this promise with a handler that will
 * call the given `propertyName` as a method on the
 * returned fulfillment value and return the result of the call.
 *
 * If more arguments are passed, those will be used as
 * respective arguments for the method call.
 *
 * Convenience method for:
 *
 * promise.then(function(value) {
 *     return value[propertyName]()
 * });
 *
 * If propertyName is a valid JS identifier and no arguments are
 * given, the call is optimized.
 *
 * @param {string} propertyName The property to call as a function.
 * @return {Promise}
 *
 */
method.call = function Promise$call( propertyName ) {
    var len = arguments.length;

    if( len < 2 ) {
        return this._callFast( propertyName );
    }
    else {
        var args = new Array(len-1);
        for( var i = 1; i < len; ++i ) {
            args[ i - 1 ] = arguments[ i ];
        }
        return this._callSlow( propertyName, args );
    }

};

/**
 * Chain this promise with a handler that will
 * read given `propertyName` on the
 * return fulfillment value.
 *
 * Convenience method for:
 *
 * promise.then(function(value) {
 *     return value[propertyName]
 * });
 *
 * If propertyName is a valid JS identifier
 * the property read is optimized.
 *
 * @param {string} propertyName The property to retrieve.
 * @return {Promise}
 *
 */
method.get = function Promise$get( propertyName ) {
    return this._then(
        getGetter( propertyName ),
        void 0,
        void 0,
        void 0,
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
method.then = function Promise$then( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.then );
};

/**
 * Any rejections that come here will be thrown.
 *
 */
method.done = function Promise$done( didFulfill, didReject, didProgress ) {
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
method.spread = function Promise$spread( didFulfill, didReject ) {
    return this._then( didFulfill, didReject, void 0,
        APPLY, void 0, this.spread );
};
/**
 * See if this promise is fulfilled.
 *
 * @return {boolean}
 */
method.isFulfilled = function Promise$isFulfilled() {
    return ( this._bitField & IS_FULFILLED ) > 0;
};

/**
 * See if this promise is rejected.
 *
 * @return {boolean}
 */
method.isRejected = function Promise$isRejected() {
    return ( this._bitField & IS_REJECTED ) > 0;
};

/**
 * See if this promise is pending (not rejected and not fulfilled).
 *
 * @return {boolean}
 */
method.isPending = function Promise$isPending() {
    return !this.isResolved();
};

/**
 * See if this promise is resolved (rejected or fulfilled).
 *
 * @return {boolean}
 */
method.isResolved = function Promise$isResolved() {
    return ( this._bitField & IS_REJECTED_OR_FULFILLED ) > 0;
};

/**
 * See if this promise can be cancelled.
 *
 * @return {boolean}
 */
method.isCancellable = function Promise$isCancellable() {
    return !this.isResolved() &&
        this._cancellable();
};

/**
 * For JSON serialization.
 *
 * @return {dynamic}
 */
method.toJSON = function Promise$toJSON() {
    var inspection = this.inspect();
    var ret = {
        isFulfilled: false,
        isRejected: false
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

/**
 * Description.
 *
 *
 */
method.map = function Promise$map( fn ) {
    return Promise.map( this, fn );
};

/**
 * Description.
 *
 *
 */
method.all = function Promise$all() {
    return Promise.all( this );
};

/**
 * Description.
 *
 *
 */
method.any = function Promise$any() {
    return Promise.any( this );
};

/**
 * Description.
 *
 *
 */
method.settle = function Promise$settle() {
    return Promise.settle( this );
};

/**
 * Description.
 *
 *
 */
method.some = function Promise$some( count ) {
    return Promise.some( this, count );
};

/**
 * Description.
 *
 *
 */
method.reduce = function Promise$reduce( fn, initialValue ) {
    return Promise.reduce( this, fn, initialValue );
};

/**
 * See if obj is a promise from this library. Same
 * as calling `obj instanceof Promise`.
 *
 * @param {dynamic} obj The object to check.
 * @return {boolean}
 */
Promise.is = isPromise;

/**
 * Description.
 *
 *
 */
Promise.settle = function Promise$Settle( promises ) {
    var ret = Promise._all( promises, SettledPromiseArray );
    return ret.promise();
};

/**
 * Description.
 *
 *
 */
Promise.all = function Promise$All( promises ) {
    var ret = Promise._all( promises, PromiseArray );
    return ret.promise();
};

/**
 * Like Promise.all but instead of having to pass an array,
 * the array is generated from the passed variadic arguments.
 *
 * Promise.all([a, b, c]) <--> Promise.join(a, b, c);
 *
 * @return {Promise}
 *
 */
Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise._all( ret, PromiseArray ).promise();
};

/**
 * Description.
 *
 *
 */
Promise.any = function Promise$Any( promises ) {
    var ret = Promise._all( promises, AnyPromiseArray );
    return ret.promise();
};

/**
 * Description.
 *
 *
 */
Promise.some = function Promise$Some( promises, howMany ) {
    var ret = Promise._all( promises, SomePromiseArray );
    if( ( howMany | 0 ) !== howMany ) {
        throw new TypeError("howMany must be an integer");
    }
    var len = ret.length();
    howMany = Math.max(0, Math.min( howMany, len ) );
    ret._howMany = howMany;
    return ret.promise();
};


function mapper( fulfilleds ) {
    var fn = this;
    var shouldDefer = false;
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
    return shouldDefer ? Promise.all( fulfilleds ) : fulfilleds;
}
/**
 * Description.
 *
 *
 */
Promise.map = function Promise$Map( promises, fn ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function" );
    return Promise.all( promises )._then(
        mapper,
        void 0,
        void 0,
        fn,
        void 0,
        Promise.map
    );
};

function reducer( fulfilleds, initialValue ) {
    var fn = this;
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
    for( var i = startIndex; i < len; ++i ) {
        if( fulfilleds[i] === void 0 &&
            !(i in fulfilleds) ) {
            continue;
        }
        accum = fn( accum, fulfilleds[i], i, len );
    }
    return accum;
}

function slowReduce( promises, fn, initialValue ) {
    return Promise._all( promises, PromiseArray, slowReduce )
        .promise()
        .then( function( fulfilleds ) {
            return reducer.call( fn, fulfilleds, initialValue );
        });
}


/**
 * Description.
 *
 *
 */
Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function");
    if( initialValue !== void 0 ) {
        return slowReduce( promises, fn, initialValue );
    }
    return Promise
    //Currently smuggling internal data has a limitation
    //in that no promises can be chained after it.
    //One needs to be able to chain to get at
    //the reduced results, so fast case is only possible
    //when there is no initialValue.
        .all( promises )
        ._then( reducer, void 0, void 0, fn, void 0, Promise.all );
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
        : Promise.fulfilled );
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
    ret._setTrace( Promise.rejected );
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
    promise._setTrace( caller );
    return new PromiseResolver( promise );
};


/**
 * Casts the object to a trusted Promise. If the
 * object is a "thenable", then the trusted promise will
 * assimilate it. Otherwise the trusted promise is immediately
 * fulfilled with obj as the fulfillment value.
 *
 * It is recommended to use just one promise library at a time,
 * so you don't have to call this method.
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
Promise.cast = function Promise$Cast( obj, caller ) {
    var ret = cast( obj, caller );
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

Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
     if( typeof generatorFunction !== "function" ) {
        throw new TypeError( "generatorFunction must be a function" );
    }
    if( !PromiseSpawn.isSupported() ) {
        throw new Error( "Attempting to use Promise.coroutine "+
                "without generatorFunction support" );
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
        throw new TypeError( "generatorFunction must be a function" );
    }
    if( !PromiseSpawn.isSupported() ) {
        var defer = Promise.pending( Promise.spawn );
        defer.reject( new Error( "Attempting to use Promise.spawn "+
                "without generatorFunction support" ));
        return defer.promise;
    }
    var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
    var ret = spawn.promise();
    spawn._run( Promise.spawn );
    return ret;
};

/**
 * Description.
 *
 *
 */
var PROCESSED = {};
var descriptor = {
    value: PROCESSED,
    writable: true,
    configurable: false,
    enumerable: false
};
function f(){}
Promise.promisify = function Promise$Promisify( callback, receiver ) {
    if( typeof callback === "object" && callback !== null ) {
        if( callback.__processedBluebirdAsync__ !== PROCESSED ) {
            for( var key in callback ) {
                if( callback.hasOwnProperty( key ) &&
                    rjsident.test( key ) &&
                    typeof callback[ key ] === "function" ) {
                    callback[ key + "Async" ] =
                        makeNodePromisified( key, THIS );
                }
            }
            Object.defineProperty( callback,
                "__processedBluebirdAsync__", descriptor );
            //Right now the above loop will easily turn the
            //object into hash table in V8
            //but this will turn it back. Yes I am ashamed.
            f.prototype = callback;
        }
        return callback;
    }
    return makeNodePromisified( callback, receiver );
};

method._then =
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
        ret._traceParent = this._peekContext() === this._traceParent
            ? this._traceParent
            : this;
        ret._setTrace( typeof caller === "function" ? caller : this._then );
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

method._length = function Promise$_length() {
    ASSERT( isPromise( this ) );
    ASSERT( arguments.length === 0 );
    return this._bitField & LENGTH_MASK;
};

method._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return ( this._bitField & IS_FOLLOWING_OR_REJECTED_OR_FULFILLED ) > 0;
};

method._setLength = function Promise$_setLength( len ) {
    this._bitField = ( this._bitField & LENGTH_CLEAR_MASK ) |
        ( len & LENGTH_MASK ) ;
};

method._cancellable = function Promise$_cancellable() {
    return ( this._bitField & IS_CANCELLABLE ) > 0;
};

method._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | IS_FULFILLED;
};

method._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | IS_REJECTED;
};

method._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | IS_FOLLOWING;
};

method._setDelegated = function Promise$_setDelegated() {
    this._bitField = this._bitField | IS_DELEGATED;
};

method._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | IS_FINAL;
};

method._isFinal = function Promise$_isFinal() {
    return ( this._bitField & IS_FINAL ) > 0;
};

method._isDelegated = function Promise$_isDelegated() {
    return ( this._bitField & IS_DELEGATED ) === IS_DELEGATED;
};

method._unsetDelegated = function Promise$_unsetDelegated() {
    this._bitField = this._bitField & ( ~IS_DELEGATED );
};

method._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | IS_CANCELLABLE;
};

method._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & ( ~IS_CANCELLABLE );
};

method._receiverAt = function Promise$_receiverAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._receiver0;
    return this[ index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE ];
};

method._promiseAt = function Promise$_promiseAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._promise0;
    return this[ index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE ];
};

method._fulfillAt = function Promise$_fulfillAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._fulfill0;
    return this[ index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE ];
};

method._rejectAt = function Promise$_rejectAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._reject0;
    return this[ index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE ];
};

method._progressAt = function Promise$_progressAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    ASSERT( index % CALLBACK_SIZE === 0 );
    if( index === 0 ) return this._progress0;
    return this[ index + CALLBACK_PROGRESS_OFFSET - CALLBACK_SIZE ];
};

method._unsetAt = function Promise$_unsetAt( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
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

var fulfiller = new Function("p",
    "'use strict';return function Promise$_fulfiller(a){ p.fulfill( a ); }" );
var rejecter = new Function("p",
    "'use strict';return function Promise$_rejecter(a){ p.reject( a ); }" );

method._resolveResolver = function Promise$_resolveResolver( resolver ) {
    ASSERT( typeof resolver === "function" );
    this._setTrace( this._resolveResolver );
    var p = new PromiseResolver( this );
    this._pushContext();
    var r = tryCatch2( resolver, this, fulfiller( p ), rejecter( p ) );
    this._popContext();
    if( r === errorObj ) {
        p.reject( r.e );
    }
};

method._addCallbacks = function Promise$_addCallbacks(
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

method._callFast = function Promise$_callFast( propertyName ) {
    return this._then(
        getFunction( propertyName ),
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

method._callSlow = function Promise$_callSlow( propertyName, args ) {
    ASSERT( isArray( args ) );
    ASSERT( args.length > 0 );
    return this._then( function( obj ) {
        return obj[propertyName].apply( obj, args );
    },
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

method._resolveLast = function Promise$_resolveLast( index ) {
    ASSERT( typeof index === "number" );
    ASSERT( index >= 0 );
    ASSERT( index < this._length() );
    var promise = this._promiseAt( index );
    var receiver = this._receiverAt( index );
    var fn;

    ASSERT( this.isFulfilled() || this.isRejected() );
    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else {
        fn = this._rejectAt( index );
    }
    this._unsetAt( index );
    var obj = this._resolvedValue;
    var ret = obj;
    if( fn !== void 0 ) {
        this._resolvePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._spreadSlowCase =
function Promise$_spreadSlowCase( targetFn, promise, values ) {
    promise._assumeStateOf(
        Promise.all( values )._then( targetFn, void 0, void 0, APPLY, void 0,
            this._spreadSlowCase ),
        false
    );
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
                    b._then(
                        resolver.fulfill,
                        resolver.reject,
                        void 0,
                        resolver,
                        void 0,
                        t
                    );
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

method._resolveThenable = function Promise$_resolveThenable( x, ref ) {
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
            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                b._then( t, r, void 0, key, void 0, t);
                return;
            }

            var fn = localP._fulfill;
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
            called = true;

            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                b._then( t, r, void 0, key, void 0, t);
                return;
            }

            var fn = localP._reject;
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

method._tryThenable = function Promise$_tryThenable( x ) {
    var ref;
    if( !thenable.is( x, ref = {ref: null, promise: null} ) ) {
        return false;
    }
    this._resolveThenable( x, ref );
    return true;
};

var ignore = CatchFilter.prototype.doFilter;
method._resolvePromise = function Promise$_resolvePromise(
    onFulfilledOrRejected, receiver, value, promise
) {
    if( isError( value ) ) {
        value.__handled = true;
    }

    //if promise is not instanceof Promise
    //it is internally smuggled data
    if( !isPromise( promise ) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x;
    //Special receiver that means we are .applying an array of arguments
    //(for .spread() at the moment)
    if( receiver === APPLY ) {
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
                        value
                    );
                    return;
                }
            }
            promise._pushContext();
            x = tryCatchApply( onFulfilledOrRejected, value );
        }
        else {
            //(TODO) Spreading a promise that eventually returns
            //an array could be a common usage
            this._spreadSlowCase( onFulfilledOrRejected, promise, value );
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
        async.invoke(
            promise._reject,
            promise,
            //1. If promise and x refer to the same object,
            //reject promise with a TypeError as the reason.
            new TypeError( "Circular thenable chain" )
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

method._assumeStateOf =
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
            void 0,
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

method._tryAssumeStateOf =
function Promise$_tryAssumeStateOf( value, mustAsync ) {
    if( !isPromise( value ) ||
        this._isFollowingOrFulfilledOrRejected() ) return false;

    this._assumeStateOf( value, mustAsync );
    return true;
};



method._attachExtraTrace = function Promise$_attachExtraTrace( error ) {
    if( longStackTraces &&
        isError( error ) ) {
        var promise = this;
        var stack = error.stack.split("\n");
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
    }
};

method._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection( reason ) {
    if( !reason.__handled ) {
        reason.__handled = true;
        CapturedTrace.possiblyUnhandledRejection( reason );
    }
};

method._unhandledRejection = function Promise$_unhandledRejection( reason ) {
    if( !reason.__handled ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

method._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

method._fulfill = function Promise$_fulfill( value ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveFulfill( value );

};

method._reject = function Promise$_reject( reason ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveReject( reason );
};

method._progress = function Promise$_progress( progressValue ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveProgress( progressValue );

};

method._resolveFulfill = function Promise$_resolveFulfill( value ) {
    ASSERT( this.isPending() );
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    var len = this._length();
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        var receiver = this._receiverAt( i );
        this._unsetAt( i );
        if( fn !== void 0 ) {
            this._resolvePromise(
                fn,
                receiver,
                value,
                promise
            );

        }
        else {
            async.invoke( promise._fulfill, promise, value );
        }
    }
};

method._resolveReject = function Promise$_resolveReject( reason ) {
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
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._rejectAt( i );
        var promise = this._promiseAt( i );
        var receiver = this._receiverAt( i );
        this._unsetAt( i );
        if( fn !== void 0 ) {
            rejectionWasHandled = true;
            this._resolvePromise(
                fn,
                receiver,
                reason,
                promise
            );
        }
        else {
            if( !rejectionWasHandled )
                rejectionWasHandled = promise._length() > 0;
            async.invoke( promise._reject, promise, reason );
        }
    }

    if( !rejectionWasHandled &&
        isError( reason ) &&
        CapturedTrace.possiblyUnhandledRejection !== void 0
    ) {
        //If the prop is not there, reading it
        //will cause deoptimization most likely
        //so do it at last possible moment
        if( reason.__handled !== true ) {
            reason.__handled = false;
            async.invoke(
                this._unhandledRejection,
                this,
                reason
            );
        }
    }

};

method._resolveProgress = function Promise$_resolveProgress( progressValue ) {
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
                    ret.e.__handled = true;
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
method._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if( lastIndex >= 0 ) {
        return contextStack[ lastIndex ];
    }
    return void 0;

};

method._pushContext = function Promise$_pushContext() {
    if( !longStackTraces ) return;
    contextStack.push( this );
};

method._popContext = function Promise$_popContext() {
    if( !longStackTraces ) return;
    contextStack.pop();
};


Promise._all =
function Promise$_All( promises, PromiseArray, caller ) {
    ASSERT( typeof PromiseArray === "function" );
    if( isPromise( promises ) ||
        isArray( promises ) ) {

        return new PromiseArray( promises,
            typeof caller === "function"
            ? caller
            : Promise$_All
        );
    }
    throw new TypeError("expecting an array or a promise");
};

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


