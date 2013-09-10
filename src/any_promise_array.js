var AnyPromiseArray = (function() {
// the PromiseArray to use with Promise.any method

function AnyPromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( AnyPromiseArray, PromiseArray );


method._init = function() {
    //.any must resolve to undefined in case of empty array
    this._init$( void 0, null );
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
    this._values[ index.valueOf() ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();