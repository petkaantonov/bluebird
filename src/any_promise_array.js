var AnyPromiseArray = (function() {
// the PromiseArray to use with Promise.any method
var AnyPromiseArray = subPromiseArray( "AnyPromiseArray" );
var method = AnyPromiseArray.prototype;

method._$init = method._init;

method._init = function() {
    //.any must resolve to undefined in case of empty array
    this._$init( void 0, null );
};

//override
method._promiseFulfilled = function( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
//override
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    var totalResolved = ++this._totalResolved;
    this._values[ index ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();