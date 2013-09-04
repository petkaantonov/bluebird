var Promise = (function() {

//Fork, uncancellable
/*
bitfield + length
clean up async
all exception strings should be constant
*/

//CancelException -> CancellationError

function Promise() {
    //See layout in util.js
    this._bitField = IS_CANCELLABLE;
    //Since most promises only have 0-1 parallel handlers
    //store the first ones directly on the object
    this._fulfill0 =
    this._reject0 =
    this._update0 =
    this._promise0 =
    this._receiver0 =
        void 0;
    //reason for rejection or fulfilled value
    this._completionValue = UNRESOLVED;
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

method.updated = function( fn, receiver ) {
    return this._then( void 0, void 0, fn, receiver );
};

method.completed = function( fn, receiver ) {
    return this._then( fn, fn, void 0, receiver );
};

method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Completed promises always have ._cancellationParent === null
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    //Recursively the propagated parent or had no parents
    if( cancelTarget === this ) {
        async.call( this._reject, this, new CancelException() );
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

method.then = function( didFulfill, didReject, didUpdate ) {
    return this._then( didFulfill, didReject, didUpdate, this );
};

method.isPending = function() {
    return !this.isCompleted();
};

method.isCompleted = function() {
    return ( this._bitField & IS_COMPLETED ) > 0;
};

method.isFulfilled = function() {
    return ( this._bitField & IS_FULFILLED ) > 0;
};

method.isRejected = function() {
    return ( this._bitField & IS_REJECTED ) > 0;
};

method.isCancellable = function() {
    return !this.isCompleted() &&
        ( this._bitField & IS_CANCELLABLE ) > 0;
};

method._then = function( didFulfill, didReject, didUpdate, receiver ) {
    var ret = new Promise();
    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didUpdate, ret, receiver );

    if( this.isCompleted() ) {
        async.call( this._completeLast, this, callbackIndex );
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
    this._bitField = ( this._bitField & LENGTH_CLEAR_MASK ) | len;
};

method._setCompleted = function() {
    this._bitField = this._bitField | IS_COMPLETED;
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

method._callbackReceiverAt = function( index ) {
    if( index === 0 ) return this._receiver0;
    return this[ index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE ];
};

method._callbackPromiseAt = function( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE ];
};

method._callbackFulfillAt = function( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE ];
};

method._callbackRejectAt = function( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE ];
};

method._callbackUpdateAt = function( index ) {
    if( index === 0 ) return this._update0;
    return this[ index + CALLBACK_UPDATE_OFFSET - CALLBACK_SIZE ];
};

method._addCallbacks = function( fulfill, reject, update, promise, receiver ) {
    fulfill = typeof fulfill === "function" ? fulfill : noop;
    reject = typeof reject === "function" ? reject : noop;
    update = typeof update === "function" ? update : noop;
    var index = this._length();

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._update0 = update;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength( index + CALLBACK_SIZE );
        return index;
    }

    this[ index - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET ] = fulfill;
    this[ index - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET ] = reject;
    this[ index - CALLBACK_SIZE + CALLBACK_UPDATE_OFFSET ] = update;
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

method._completeLast = function( index ) {
    var promise = this._callbackPromiseAt( index );
    var receiver = this._callbackReceiverAt( index );
    var fn;

    if( this.isFulfilled() ) {
        fn = this._callbackFulfillAt( index );
    }
    else if( this.isRejected() ) {
        fn = this._callbackRejectAt( index );
    }
    else unreachable();

    var obj = this._completionValue;
    var ret = obj;
    if( fn !== noop ) {
        this._completePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._completePromise = function(
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
                promise._update,
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

method._completeFulfill = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._callbackFulfillAt( i );
        var promise = this._callbackPromiseAt( i );
        if( fn !== noop ) {
            this._completePromise(
                fn,
                this._callbackReceiverAt( i ),
                obj,
                promise
            );
        }
        else {
            async.call( this._fulfill, promise, obj );
        }
    }
};

method._completeReject = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._callbackRejectAt( i );
        var promise = this._callbackPromiseAt( i );
        if( fn !== noop ) {
            this._completePromise(
                fn,
                this._callbackReceiverAt( i ),
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
    this._setCompleted();
};

method._fulfill = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._setFulfilled();
    this._completionValue = obj;
    this._completeFulfill( obj );

};

method._reject = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._setRejected();
    this._completionValue = obj;
    this._completeReject( obj );
};

method._update = function( obj ) {
    if( this.isCompleted() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += CALLBACK_SIZE ) {
        var fn = this._callbackUpdateAt( i );
        var promise = this._callbackPromiseAt( i );
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._callbackReceiverAt( i ), obj );
            if( ret === errorObj ) {
                async.call( this._reject, this, errorObj.e );
                return;
            }
        }
        async.call( this._update, promise, ret );
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
    function succeed( val ) {
        values[ indexOf( promises, this ) ] = val;
        total++;
        if( total === len ) {
            ret.fulfill( values );
        }
    }
    function fail( reason ) {
        ret.reject( reason );
    }
    for( var i = 0; i < len; ++i ) {
        var promise = promises[i];
        promise.succeeded( succeed );
        promise.failed( fail );

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
    return new PendingPromise( new Promise() );
};

return Promise;})();

