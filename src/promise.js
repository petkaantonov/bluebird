var Promise = (function() {

function isThenable( ret, ref ) {
    try {
        var then = ret.then;
        if( typeof then === "function" ) {
            ref.ref = then;
            return true;
        }
        return false;
    }
    catch(e) {
        errorObj.e = e;
        ref.ref = errorObj;
        return true;
    }
}

function isObject( value ) {
    if( value == null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" );
}

function isPromise( value ) {
    return isObject(value) &&
        typeof value.then === "function";
}



function Promise( resolver ) {
    if( typeof resolver === "function" )
        resolver( new PromiseResolver( this ) );
    //See layout in util.js
    this._bitField = IS_CANCELLABLE;
    //Since most promises only have 0-1 parallel handlers
    //store the first ones directly on the object
    //This optimizes for exactly 1 parallel handler I.E. 99%
    this._fulfill0 =
    this._reject0 =
    this._progress0 =
    this._promise0 =
    this._receiver0 =
        void 0;
    //reason for rejection or fulfilled value
    this._resolvedValue = UNRESOLVED;
    //Used in cancel propagation
    this._cancellationParent = null;
}
var method = Promise.prototype;

method.toString = function() {
    return "[object Promise]";
};

method.fulfilled = function( fn, receiver ) {
    return this._then( fn, void 0, void 0, receiver );
};

method.rejected = function( fn, receiver ) {
    return this._then( void 0, fn, void 0, receiver );
};

method.progressed = function( fn, receiver ) {
    return this._then( void 0, void 0, fn, receiver );
};

method.resolved = function( fn, receiver ) {
    return this._then( fn, fn, void 0, receiver );
};

method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Resolved promises always have ._cancellationParent === null
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    //Recursively the propagated parent or had no parents
    if( cancelTarget === this ) {
        async.call( this._reject, this, new CancellationError() );
    }
    else {
        //Have pending parents, call cancel on the oldest
        async.call( cancelTarget.cancel, cancelTarget, void 0);
    }
    return this;
};

method.call = function( propertyName ) {
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

method.get = function( propertyName ) {
    return this.then( getGetter( propertyName ) );
};

method.then = function( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress, this );
};

method.isPending = function() {
    return !this.isResolved();
};

method.isResolved = function() {
    return ( this._bitField & IS_RESOLVED ) > 0;
};

method.isFulfilled = function() {
    return ( this._bitField & IS_FULFILLED ) > 0;
};

method.isRejected = function() {
    return ( this._bitField & IS_REJECTED ) > 0;
};

method.isCancellable = function() {
    return !this.isResolved() &&
        ( this._bitField & IS_CANCELLABLE ) > 0;
};

method._then = function( didFulfill, didReject, didProgress, receiver ) {
    var ret = new Promise();
    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        async.call( this._resolveLast, this, callbackIndex );
    }
    else if( this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    return ret;
};

method._length = function() {
    return this._bitField & LENGTH_MASK;
};

method._setLength = function( len ) {
    this._bitField = ( this._bitField & LENGTH_CLEAR_MASK ) |
        ( len & LENGTH_MASK ) ;
};

method._setResolved = function() {
    this._bitField = this._bitField | IS_RESOLVED;
};

method._setFulfilled = function() {
    this._bitField = this._bitField | IS_FULFILLED;
};

method._setRejected = function() {
    this._bitField = this._bitField | IS_REJECTED;
};

method._setCancellable = function() {
    this._bitField = this._bitField | IS_CANCELLABLE;
};

method._receiverAt = function( index ) {
    if( index === 0 ) return this._receiver0;
    return this[ index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE ];
};

method._promiseAt = function( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE ];
};

method._fulfillAt = function( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE ];
};

method._rejectAt = function( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE ];
};

method._progressAt = function( index ) {
    if( index === 0 ) return this._progress0;
    return this[ index + CALLBACK_PROGRESS_OFFSET - CALLBACK_SIZE ];
};

method._addCallbacks = function(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    fulfill = typeof fulfill === "function" ? fulfill : noop;
    reject = typeof reject === "function" ? reject : noop;
    progress = typeof progress === "function" ? progress : noop;
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

method._callFast = function( propertyName ) {
    return this.then( getFunction( propertyName ) );
};

method._callSlow = function( propertyName, args ) {
    return this.then( function( obj ) {
        return obj[propertyName].apply( obj, args );
    });
};

method._resolveLast = function( index ) {
    var promise = this._promiseAt( index );
    var receiver = this._receiverAt( index );
    var fn;

    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else if( this.isRejected() ) {
        fn = this._rejectAt( index );
    }
    else unreachable();

    var obj = this._resolvedValue;
    var ret = obj;
    if( fn !== noop ) {
        this._resolvePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._resolvePromise = function(
    onFulfilledOrRejected, receiver, value, promise
) {
    if( receiver === void 0 ) {
        receiver = this;
    }
    var x = tryCatch1( onFulfilledOrRejected, receiver, value );
    if( x === errorObj ) {
        async.call( promise._reject, promise, errorObj.e );
    }
    else if( x === promise ) {
        async.call(
            promise._reject,
            promise,
            //1. If promise and x refer to the same object,
            //reject promise with a TypeError as the reason.
            new TypeError( TYPE_ERROR_INFINITE_CYCLE )
        );
    }
    else {
        var ref;
        if( x instanceof Promise ) {
            //2. If x is a promise, adopt its state
            if( x.isCancellable() ) {
                promise._cancellationParent = x;
            }
            x._then(
                promise._fulfill,
                promise._reject,
                promise._progress,
                promise
            );
        }
        //3. Otherwise, if x is an object or function,
        else if( isObject( x ) && isThenable( x, ref = {ref: null} ) ) {
            //3.2 If retrieving the property x.then
            //results in a thrown exception e,
            //reject promise with e as the reason.
            if( ref.ref === errorObj ) {
                async.call( promise._reject, promise, errorObj.e );
            }
            else {
                //3.1. Let then be x.then
                var then = ref.ref;
                //3.3 If then is a function, call it with x as this,
                //first argument resolvePromise, and
                //second argument rejectPromise
                var threw = tryCatch2(
                        then,
                        x,
                        bindDefer( promise._fulfill, promise ),
                        bindDefer( promise._reject, promise )
                );
                //3.3.4 If calling then throws an exception e,
                if( threw === errorObj ) {
                    //3.3.4.2 Otherwise, reject promise with e as the reason.
                    async.call( promise._reject, promise, errorObj.e );
                }
            }
        }
        // 3.4 If then is not a function, fulfill promise with x.
        // 4. If x is not an object or function, fulfill promise with x.
        else {
            async.call( promise._fulfill, promise, x );
        }
    }
};

method._resolveFulfill = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
                obj,
                promise
            );
        }
        else {
            async.call( this._fulfill, promise, obj );
        }
    }
};

method._resolveReject = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._rejectAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
                obj,
                promise
            );
        }
        else {
            async.call( this._reject, promise, obj );
        }
    }
};

method._cleanValues = function() {
    this._cancellationParent = null;
    this._setResolved();
};

method._fulfill = function( obj ) {
    if( this.isResolved() ) return;
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = obj;
    this._resolveFulfill( obj );

};

method._reject = function( obj ) {
    if( this.isResolved() ) return;
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = obj;
    this._resolveReject( obj );
};

method._progress = function( obj ) {
    if( this.isResolved() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += CALLBACK_SIZE ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._receiverAt( i ), obj );
            if( ret === errorObj ) {
                async.call( this._reject, this, errorObj.e );
                return;
            }
        }
        async.call( this._progress, promise, ret );
    }
};

Promise.is = isPromise;

Promise.when = function( promises ) {
    if( !isArray( promises ) ) {
        promises = [].slice.call( arguments );
    }
    var ret = Promise.pending();
    var len = promises.length;
    var values = new Array( promises.length );
    var total = 0;
    function fulfill( val ) {
        values[ indexOf( promises, this ) ] = val;
        total++;
        if( total === len ) {
            ret.fulfill( values );
        }
    }
    function reject( reason ) {
        ret.reject( reason );
    }
    for( var i = 0; i < len; ++i ) {
        var promise = promises[i];
        promise.fulfilled( fulfill );
        promise.rejected( reject );

    }
    return ret.promise;
};

Promise.fulfilled = function( value ) {
    var ret = new Promise();
    ret._fulfill( value );
    return ret;
};

Promise.rejected = function( value ) {
    var ret = new Promise();
    ret._reject( value );
    return ret;
};

Promise.pending = function() {
    return new PromiseResolver( new Promise() );
};

return Promise;})();

