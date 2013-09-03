var Promise = (function() {

function Promise( resolver, onCancelled ) {
    this._isCompleted = false;
    this._isFulfilled = false;
    this._isRejected = false;
    this._isCancellable = true;

    //Since most promises only have 0-1 handlers
    //store the first ones directly on the object
    this._fulfill0 =
    this._reject0 =
    this._update0 =
    this._promise0 =
    this._receiver0 =
        void 0;

    //store rest on array
    this._callbacks = null;
    this._callbacksLength = 0;

    //reason for rejection or fulfilled value
    this._completionValue = UNRESOLVED;

    this._cancelParent = null;
    this._onCancelled = typeof onCancelled === "function"
        ? onCancelled
        : noop;

    if( typeof resolver === "function" ) {
        var len = resolver.length;
        var fulfill, reject, update;

        if( len > 0 ) fulfill = bindDefer( this._fulfill, this );
        if( len > 1 ) reject = bindDefer( this._reject, this );
        if( len > 2 ) update = bindDefer( this._update, this );

        resolver( fulfill, reject, update );
    }
}
var method = Promise.prototype;

method.toString = function() {
    return "[object Promise]";
};

method.fulfilled = function( fn, receiver ) {
    return this._then( fn, void 0, void 0, receiver, false );
};

method.rejected = function( fn, receiver ) {
    return this._then( void 0, fn, void 0, receiver, false );
};

method.updated = function( fn, receiver ) {
    return this._then( void 0, void 0, fn, receiver, false );
};

method.completed = function( fn, receiver ) {
    return this._then( fn, fn, void 0, receiver, false );
};


//Hack to prevent cancellations from taking
//2 event ticks to complete
var SYNC_TOKEN = {};
method.cancel = function( _token ) {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Completed promises always have ._cancelParent === null
    while( cancelTarget._cancelParent !== null ) {
        cancelTarget = cancelTarget._cancelParent;
    }
    //Recursively the propagated parent or had no parents
    if( cancelTarget === this ) {
        if( _token === SYNC_TOKEN ) {
            this._reject( new CancelException() );
        }
        else {
            async.call( this._reject, this, new CancelException() );
        }
    }
    else {
        //Have pending parents, call cancel on the oldest
        async.call( cancelTarget.cancel, cancelTarget, SYNC_TOKEN );
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
    return this._then( didFulfill, didReject, didUpdate, this, false );
};

method.isPending = function() {
    return !this.isCompleted();
};

method.isCompleted = function() {
    return this._isCompleted;
};

method.isFulfilled = function() {
    return this._isFulfilled;
};

method.isRejected = function() {
    return this._isRejected;
};

method.isCancellable = function() {
    return !this._isCompleted && this._isCancellable;
};

method._then = function( didFulfill, didReject, didUpdate, receiver, sync ) {
    var ret = new Promise();
    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didUpdate, ret, receiver );

    if( this.isCompleted() ) {
        if( sync ) {
            this._completeLast( callbackIndex );
        }
        else {
            async.call( this._completeLast, this, callbackIndex );
        }
    }
    else if( this.isCancellable() ) {
        ret._cancelParent = this;
    }

    return ret;
};

method._callbackReceiverAt = function( index ) {
    if( index === 0 ) return this._receiver0;
    return this._callbacks[ index + CALLBACK_RECEIVER_OFFSET - CALLBACK_SIZE ];
};

method._callbackPromiseAt = function( index ) {
    if( index === 0 ) return this._promise0;
    return this._callbacks[ index + CALLBACK_PROMISE_OFFSET - CALLBACK_SIZE ];
};

method._callbackFulfillAt = function( index ) {
    if( index === 0 ) return this._fulfill0;
    return this._callbacks[ index + CALLBACK_FULFILL_OFFSET - CALLBACK_SIZE ];
};

method._callbackRejectAt = function( index ) {
    if( index === 0 ) return this._reject0;
    return this._callbacks[ index + CALLBACK_REJECT_OFFSET - CALLBACK_SIZE ];
};

method._callbackUpdateAt = function( index ) {
    if( index === 0 ) return this._update0;
    return this._callbacks[ index + CALLBACK_UPDATE_OFFSET - CALLBACK_SIZE ];
};

method._addCallbacks = function( fulfill, reject, update, promise, receiver ) {
    fulfill = typeof fulfill === "function" ? fulfill : noop;
    reject = typeof reject === "function" ? reject : noop;
    update = typeof update === "function" ? update : noop;
    var index = this._callbacksLength | 0;

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._update0 = update;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._callbacksLength = index + CALLBACK_SIZE;
        return index;
    }

    var callbacks = this._callbacks;

    if( callbacks === null ) {
        callbacks = this._callbacks = new Array( CALLBACK_SIZE );
    }

    if( ( index + CALLBACK_SIZE ) >= callbacks.length ) {
        callbacks.length = callbacks.length + CALLBACK_SIZE;
    }

    callbacks[ index - CALLBACK_SIZE + CALLBACK_FULFILL_OFFSET ] = fulfill;
    callbacks[ index - CALLBACK_SIZE + CALLBACK_REJECT_OFFSET ] = reject;
    callbacks[ index - CALLBACK_SIZE + CALLBACK_UPDATE_OFFSET ] = update;
    callbacks[ index - CALLBACK_SIZE + CALLBACK_PROMISE_OFFSET ] = promise;
    callbacks[ index - CALLBACK_SIZE + CALLBACK_RECEIVER_OFFSET ] = receiver;
    this._callbacksLength = index + CALLBACK_SIZE;
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

method._completePromise = function( fn, receiver, value, promise2 ) {
    if( receiver === void 0 ) {
        receiver = this;
    }
    var ret = tryCatch1( fn, receiver, value );
    if( ret === errorObj ) {
        promise2._reject( errorObj.e );
    }
    else if( isPromise( ret ) ) {
        if( ret instanceof Promise ) {
            if( ret.isCancellable() ) {
                promise2._cancelParent = ret;
            }
            ret._then(
                promise2._fulfill,
                promise2._reject,
                promise2._update,
                promise2,
                true
            );

        }
        else {
            ret.then(
                bindDefer( promise2._fulfill, promise2 ),
                bindDefer( promise2._reject, promise2 )
            );
        }
    }
    else {
        promise2._fulfill( ret );
    }
};

method._completeFulfill = function( obj ) {
    var len = this._callbacksLength;
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
            promise._fulfill( obj );
        }
    }
};

method._completeReject = function( obj ) {
    var len = this._callbacksLength;
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
            promise._reject( obj );
        }
    }
};

method._cleanValues = function() {
    this._cancelParent = null;
    this._isCompleted = true;
    this._onCancelled = noop;
};

method._fulfill = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._isFulfilled = true;
    this._completionValue = obj;
    this._completeFulfill( obj );
};

method._reject = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._isRejected = true;
    this._completionValue = obj;
    this._completeReject( obj );
};

method._update = function( obj ) {
    if( this.isCompleted() ) return;
    var len = this._callbacksLength;
    for( var i = 0; i < len; i+= CALLBACK_SIZE ) {
        var fn = this._callbackUpdateAt( i );
        var promise = this._callbackPromiseAt( i );
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._callbackReceiverAt( i ), obj );
            if( ret === errorObj ) {
                this._reject( errorObj.e );
                return;
            }
        }
        promise._update( ret );
    }
};

function isPromise( value ) {
    if( value == null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" ) &&
        typeof value.then === "function";
}

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

