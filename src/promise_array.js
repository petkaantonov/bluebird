"use strict";
module.exports = function( Promise ) {
var ASSERT = require("./assert.js");
var ensureNotHandled = require( "./errors.js").ensureNotHandled;
var util = require("./util.js");
var async = require( "./async.js");
var hasOwn = {}.hasOwnProperty;
var isArray = util.isArray;

//To avoid eagerly allocating the objects
//and also because void 0 or promises cannot be smuggled
function toResolutionValue( val ) {
    switch( val ) {
    case RESOLVE_UNDEFINED: return void 0;
    case RESOLVE_ARRAY: return [];
    case RESOLVE_OBJECT: return {};
    case RESOLVE_FOREVER_PENDING:
        //Passive aggressive comment: many agree that
        //this memory leak is better than rejecting
        //when empty array is passed to Promise.race
        return Promise.defer().promise;
    }
    ASSERT( false );
}

function PromiseArray( values, caller, boundTo ) {
    ASSERT( arguments.length === 3 );
    this._values = values;
    this._resolver = Promise.pending( caller );
    if( boundTo !== void 0 ) {
        this._resolver.promise._setBoundTo( boundTo );
    }
    this._length = 0;
    this._totalResolved = 0;
    this._init( void 0, RESOLVE_ARRAY );
}
PromiseArray.PropertiesPromiseArray = function() {};

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
    if( Promise.is( values ) ) {
        //Expect the promise to be a promise
        //for an array
        if( values.isFulfilled() ) {
            //Fulfilled promise with hopefully
            //an array as a resolution value
            values = values._resolvedValue;
            if( !isArray( values ) ) {
                this._fulfill( toResolutionValue( fulfillValueIfEmpty ) );
                return;
            }
            this._values = values;
        }
        else if( values.isPending() ) {
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
        else {
            this._reject( values._resolvedValue );
            return;
        }
    }
    if( values.length === 0 ) {
        this._fulfill( toResolutionValue( fulfillValueIfEmpty ) );
        return;
    }
    var len = values.length;
    var newLen = len;
    var newValues;
    if( this instanceof PromiseArray.PropertiesPromiseArray ) {
        newValues = this._values;
    }
    else {
        newValues = new Array( len );
    }
    var isDirectScanNeeded = false;
    for( var i = 0; i < len; ++i ) {
        var promise = values[i];
        //checking for undefined first (1 cycle instruction) in order not to
        //punish reasonable non-sparse arrays
        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }
        var maybePromise = Promise._cast(promise, void 0, void 0);
        if( maybePromise instanceof Promise &&
            maybePromise.isPending() ) {
            //Guaranteed to be called after the possible direct scan
            maybePromise._then(
                this._promiseFulfilled,
                this._promiseRejected,
                this._promiseProgressed,

                this, //Smuggle receiver - .bind avoided round 1
                i, //Smuggle the index as internal data
                  //to avoid creating closures in this loop
                  //- .bind avoided round 2

                  //Will not chain so creating a Promise from
                  //the ._then() would be a waste anyway

                 this._scanDirectValues
            );
        }
        else {
            isDirectScanNeeded = true;
        }
        newValues[i] = maybePromise;
    }
    //Array full of holes
    if( newLen === 0 ) {
        if( fulfillValueIfEmpty === RESOLVE_ARRAY ) {
            this._fulfill( newValues );
        }
        else {
            this._fulfill( toResolutionValue( fulfillValueIfEmpty ) );
        }
        return;
    }
    this._values = newValues;
    this._length = newLen;
    if( isDirectScanNeeded ) {
        var scanMethod = newLen === len
            ? this._scanDirectValues
            : this._scanDirectValuesHoled;
        async.invoke( scanMethod, this, len );
    }
};

PromiseArray.prototype._resolvePromiseAt =
function PromiseArray$_resolvePromiseAt( i ) {
    var value = this._values[i];
    if( !Promise.is( value ) ) {
        this._promiseFulfilled( value, i );
    }
    else if( value.isFulfilled() ) {
        this._promiseFulfilled( value._resolvedValue, i );
    }
    else if( value.isRejected() ) {
        this._promiseRejected( value._resolvedValue, i );
    }
};

PromiseArray.prototype._scanDirectValuesHoled =
function PromiseArray$_scanDirectValuesHoled( len ) {
    ASSERT( len > this.length() );
    for( var i = 0; i < len; ++i ) {
        if( this._isResolved() ) {
            break;
        }
        if( hasOwn.call( this._values, i ) ) {
            this._resolvePromiseAt( i );
        }
    }
};

PromiseArray.prototype._scanDirectValues =
function PromiseArray$_scanDirectValues( len ) {
    ASSERT( len >= this.length() );
    for( var i = 0; i < len; ++i ) {
        if( this._isResolved() ) {
            break;
        }
        this._resolvePromiseAt( i );
    }
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

return PromiseArray;
};
