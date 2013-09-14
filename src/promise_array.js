var PromiseArray = (function() {

//Because undefined cannot be smuggled
//we smuggle null instead and convert back to undefined
//when calling
//breaks down if null needs to be smuggled but so far doesn't
function nullToUndefined( val ) {
    return val === null
        ? void 0
        : val;
}

var hasOwn = {}.hasOwnProperty;
var empty = [];

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
    this._init( void 0, empty );
}
var method = PromiseArray.prototype;

method.length = function() {
    return this._length;
};

method.promise = function() {
    return this._resolver.promise;
};


                        //when.some resolves to [] when empty
                        //but when.any resolved to void 0 when empty :<
method._init = function _init( _, fulfillValueIfEmpty ) {
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
                this._fulfill( nullToUndefined( fulfillValueIfEmpty ) );
                return;
            }
            this._values = values;
        }

    }
    if( !values.length ) {
        this._fulfill( nullToUndefined( fulfillValueIfEmpty ) );
        return;
    }
    var len = values.length;
    var newLen = len;
    var newValues = new Array( len );
    for( var i = 0; i < len; ++i ) {
        var promise = values[i];

        //checking for undefined first (1 cycle instruction) in order not to
        //punish reasonable non-sparse arrays
        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }
        if( !isPromise( promise ) ) {
            promise = Promise.fulfilled( promise );
        }
        promise._then(
            this._promiseFulfilled,
            this._promiseRejected,
            this._promiseProgressed,

            this, //Smuggle receiver - .bind avoided round 1
            Integer.get( i ), //Smuggle the index as internal data
              //to avoid creating closures in this loop - .bind avoided round 2

              //Will not chain so creating a Promise from
              //the ._then() would be a waste anyway

              //The integer is wrapped because raw integers currently cause
              //circular deoptimizations - this gives 20% boost in
              //gorgikosev's benchmarks
             this.constructor



        );
        newValues[i] = promise;
    }
    this._values = newValues;
    this._length = newLen;
};

method._isResolved = function() {
    return this._values === null;
};

method._fulfill = function( value ) {
    ASSERT( !this._isResolved() );
    this._values = null;
    this._resolver.fulfill( value );
};

method._reject = function( reason ) {
    ASSERT( !this._isResolved() );
    this._values = null;
    this._resolver.reject( reason );
};

method._promiseProgressed = function( progressValue ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );
    this._resolver.progress( progressValue );
};

method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );
    ASSERT( index instanceof Integer );
    //(TODO) could fire a progress when a promise is completed
    this._values[ index.valueOf() ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

method._promiseRejected = function( reason ) {
    if( this._isResolved() ) return;
    ASSERT( isArray( this._values ) );
    this._totalResolved++;
    this._reject( reason );
};

function Integer( value ) {
    this._value = value;
}

Integer.prototype.valueOf = function() {
    return this._value;
};
//256 first integers from 0 are cached
Integer.get = function( i ) {
    if( i < 256 ) {
        return ints[i];
    }
    return new Integer(i);
};

var ints = [];
for( var i = 0; i < 256; ++i ) {
    ints.push( new Integer(i) );
}





return PromiseArray;})();