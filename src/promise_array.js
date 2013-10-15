var PromiseArray = (function() {
CONSTANT(FULFILL_UNDEFINED, 0);
CONSTANT(FULFILL_ARRAY, 1);
CONSTANT(FULFILL_OBJECT, 2);

//To avoid eagerly allocating the objects
//and also because void 0 cannot be smuggled
function toFulfillmentValue( val ) {
    switch( val ) {
    case FULFILL_UNDEFINED: return void 0;
    case FULFILL_ARRAY: return [];
    case FULFILL_OBJECT: return {};
    }
    ASSERT( false );
}

var hasOwn = {}.hasOwnProperty;
function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

var Arr = Array;
var isArray = Arr.isArray || function( obj ) {
    return obj instanceof Arr;
};

function PromiseArray( values, caller ) {
    this._values = values;
    this._resolver = Promise.pending( caller );
    this._length = 0;
    this._totalResolved = 0;
    this._init( void 0, FULFILL_ARRAY );
}
PromiseArray.prototype.length = function PromiseArray$length() {
    return this._length;
};

PromiseArray.prototype.promise = function PromiseArray$promise() {
    return this._resolver.promise;
};

PromiseArray.prototype._init =
            //when.some resolves to [] when empty
            //but when.any resolved to void 0 when empty :<
function PromiseArray$_init( _, fulfillValueIfEmpty ) {
            //_ must be intentionally empty because smuggled
            //data is always the second argument
            //all of this is due to when vs some having different semantics on
            //empty arrays
    var values = this._values;
    if( isPromise( values ) ) {
        //Expect the promise to be a promise
        //for an array
        if( values.isPending() ) {
            values._then(
                this._init,
                this._reject,
                void 0,
                this,
                fulfillValueIfEmpty,
                this.constructor
            );
            return;
        }
        else if( values.isRejected() ) {
            this._reject( values._resolvedValue );
            return;
        }
        else {
            //Fulfilled promise with hopefully
            //an array as a resolution value
            values = values._resolvedValue;
            if( !isArray( values ) ) {
                this._fulfill( toFulfillmentValue( fulfillValueIfEmpty ) );
                return;
            }
            this._values = values;
        }

    }
    if( !values.length ) {
        this._fulfill( toFulfillmentValue( fulfillValueIfEmpty ) );
        return;
    }
    var len = values.length;
    var newLen = len;
    var newValues;
    if( this instanceof PropertiesPromiseArray ) {
        newValues = this._values;
    }
    else {
        newValues = new Array( len );
    }
    for( var i = 0; i < len; ++i ) {
        var promise = values[i];

        //checking for undefined first (1 cycle instruction) in order not to
        //punish reasonable non-sparse arrays
        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }

        promise = Promise.cast( promise );

        promise._then(
            this._promiseFulfilled,
            this._promiseRejected,
            this._promiseProgressed,

            this, //Smuggle receiver - .bind avoided round 1
            i, //Smuggle the index as internal data
              //to avoid creating closures in this loop - .bind avoided round 2

              //Will not chain so creating a Promise from
              //the ._then() would be a waste anyway

             this.constructor



        );
        newValues[i] = promise;
    }
    this._values = newValues;
    this._length = newLen;
};

PromiseArray.prototype._isResolved = function PromiseArray$_isResolved() {
    return this._values === null;
};

PromiseArray.prototype._fulfill = function PromiseArray$_fulfill( value ) {
    ASSERT( !this._isResolved() );
    this._values = null;
    this._resolver.fulfill( value );
};

PromiseArray.prototype._reject = function PromiseArray$_reject( reason ) {
    ASSERT( !this._isResolved() );
    ensureNotHandled( reason );
    this._values = null;
    this._resolver.reject( reason );
};

PromiseArray.prototype._promiseProgressed =
function PromiseArray$_promiseProgressed( progressValue, index ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );

    this._resolver.progress({
        index: index,
        value: progressValue
    });
};

PromiseArray.prototype._promiseFulfilled =
function PromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );
    ASSERT( typeof index === "number" );
    this._values[ index ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

PromiseArray.prototype._promiseRejected =
function PromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );
    this._totalResolved++;
    this._reject( reason );
};

return PromiseArray;})();
