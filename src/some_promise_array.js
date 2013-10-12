var SomePromiseArray = (function() {
// the PromiseArray to use with Promise.some method

function SomePromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
inherits( SomePromiseArray, PromiseArray );

SomePromiseArray.prototype._init = function SomePromiseArray$_init() {
    this._init$( void 0, [] );
    this._howMany = 0;
    this._rejectionValues = null;
    this._fulfillmentValues = null;
    if( this._isResolved() ) return;

    if( this._howMany > this._canPossiblyFulfill()  ) {
        this._reject( [] );
    }
};

//override
SomePromiseArray.prototype._promiseFulfilled =
function SomePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;

    var totalResolved = this._totalResolved;
    this._addFulfilled( value );
    this._totalResolved = totalResolved + 1;
    if( totalResolved + 1 === this._howMany ) {
        this._fulfillmentValues.length = this._howMany;
        this._fulfill( this._fulfillmentValues );
        this._fulfillmentValues =
            this._rejectionValues = null;
    }

};
//override
SomePromiseArray.prototype._promiseRejected =
function SomePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;

    this._addRejected( reason );
    this._totalResolved++;

    if( this._howMany > this._canPossiblyFulfill() ) {
        this._reject( this._rejectionValues );
        this._fulfillmentValues =
            this._rejectionValues = null;
    }
};

SomePromiseArray.prototype._rejected = function SomePromiseArray$_rejected() {
    return this._rejectionValues === null
        ? 0
        : this._rejectionValues.length;
};

SomePromiseArray.prototype._addRejected =
function SomePromiseArray$_addRejected( reason ) {
    if( this._rejectionValues === null ) {
        this._rejectionValues = [reason];
    }
    else {
        this._rejectionValues.push( reason );
    }
};

SomePromiseArray.prototype._addFulfilled =
function SomePromiseArray$_addFulfilled( value ) {
    if( this._fulfillmentValues === null ) {
        this._fulfillmentValues = [value];
    }
    else {
        this._fulfillmentValues.push( value );
    }
};

SomePromiseArray.prototype._canPossiblyFulfill =
function SomePromiseArray$_canPossiblyFulfill() {
            //fulfilled already
    return this._totalResolved - this._rejected() +
        //could fulfill
        ( this.length() - this._totalResolved );
};
return SomePromiseArray;})();
