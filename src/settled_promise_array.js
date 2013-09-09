var SettledPromiseArray = (function() {
// the PromiseArray to use with Promise.settle method
var SettledPromiseArray = subPromiseArray( "SettledPromiseArray" );
var method = SettledPromiseArray.prototype;
var throwawayPromise = new Promise();

method._promiseResolved = function( index, inspection ) {
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};
//override
method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = IS_FULFILLED;
    ret._resolvedValue = value;
    this._promiseResolved( index, ret );

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
    this._promiseResolved( index, ret );

};

return SettledPromiseArray;})();