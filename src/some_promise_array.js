var SomePromiseArray = (function() {
// the PromiseArray to use with Promise.some method
var SomePromiseArray = subPromiseArray( "SomePromiseArray" );
var method = SomePromiseArray.prototype;

method._$init = method._init;
method._init = function() {
    this._$init( void 0, [] );
    this._howMany = 0;
    this._rejected = 0;
    this._rejectionValues = new Array( this.length() );
    this._resolutionValues = new Array( this.length() );
    if( this._isResolved() ) return;
    var canPossiblyFulfillCount =
        this._totalResolved - this._rejected + //fulfilled already
        ( this.length() - this._totalResolved ); //could fulfill
    if( this._howMany > canPossiblyFulfillCount ) {
        this._reject( [] );
    }
};

//override
method._promiseFulfilled = function( value ) {
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
method._promiseRejected = function( reason ) {
    if( this._isResolved() ) return;

    this._rejectionValues[ this._rejected ] = reason;
    this._rejected++;
    this._totalResolved++;


    var canPossiblyFulfillCount =
        this._totalResolved - this._rejected + //fulfilled already
        ( this.length() - this._totalResolved ); //could fulfill

    if( this._howMany > canPossiblyFulfillCount ) {
        this._rejectionValues.length = this._rejected;
        this._reject( this._rejectionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }
};

return SomePromiseArray;})();