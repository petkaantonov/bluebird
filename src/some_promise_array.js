var SomePromiseArray = (function() {
// the PromiseArray to use with Promise.some method

function SomePromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
inherits( SomePromiseArray, PromiseArray );

SomePromiseArray.prototype._init = function SomePromiseArray$_init() {
    this._init$( void 0, [] );
    this._howMany = 0;
    this._rejected = 0;
    this._rejectionValues = new Array( this.length() );
    this._resolutionValues = new Array( this.length() );
    if( this._isResolved() ) return;

    if( this._howMany > this._canPossiblyFulfill()  ) {
        this._reject( [] );
    }
};

SomePromiseArray.prototype._canPossiblyFulfill =
function SomePromiseArray$_canPossiblyFulfill() {
            //fulfilled already
    return this._totalResolved - this._rejected +
        //could fulfill
        ( this.length() - this._totalResolved );
};

//override
SomePromiseArray.prototype._promiseFulfilled =
function SomePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;

    var totalResolved = this._totalResolved;
    this._resolutionValues[ totalResolved ] = value;
    this._totalResolved = totalResolved + 1;
    if( totalResolved + 1 === this._howMany ) {
        this._resolutionValues.length = this._howMany;
        this._fulfill( this._resolutionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }

};
//override
SomePromiseArray.prototype._promiseRejected =
function SomePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;

    this._rejectionValues[ this._rejected ] = reason;
    this._rejected++;
    this._totalResolved++;

    if( this._howMany > this._canPossiblyFulfill() ) {
        this._rejectionValues.length = this._rejected;
        this._reject( this._rejectionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }
};

return SomePromiseArray;})();
