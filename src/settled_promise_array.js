var SettledPromiseArray = (function() {
// the PromiseArray to use with Promise.settle method

function SettledPromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( SettledPromiseArray, PromiseArray );

method._promiseResolved = function( index, inspection ) {
    this._values[ index.valueOf() ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

var throwawayPromise = new Promise();
//override
method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = IS_FULFILLED;
    ret._resolvedValue = value;
    this._promiseResolved( index.valueOf(), ret );
};
//override
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = IS_REJECTED;
    ret._resolvedValue = reason;
    this._promiseResolved( index.valueOf(), ret );
};

return SettledPromiseArray;})();