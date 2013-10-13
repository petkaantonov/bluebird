var AnyPromiseArray = (function() {
// the PromiseArray to use with Promise.any method

function AnyPromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
inherits( AnyPromiseArray, PromiseArray );

AnyPromiseArray.prototype._init = function AnyPromiseArray$_init() {
    //.any must resolve to undefined in case of empty array
    this._init$( void 0, null );
};

//override
AnyPromiseArray.prototype._promiseFulfilled =
function AnyPromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
//override
AnyPromiseArray.prototype._promiseRejected =
function AnyPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    ASSERT( typeof index === "number" );
    var totalResolved = ++this._totalResolved;
    this._values[ index ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();
