var SettledPromiseArray = (function() {
// the PromiseArray to use with Promise.settle method

function SettledPromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
inherits( SettledPromiseArray, PromiseArray );

SettledPromiseArray.prototype._promiseResolved =
function SettledPromiseArray$_promiseResolved( index, inspection ) {
    ASSERT(typeof index === "number");
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

var throwawayPromise = new Promise()._setTrace();
//override
SettledPromiseArray.prototype._promiseFulfilled =
function SettledPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    ASSERT( typeof index === "number" );
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = IS_FULFILLED;
    ret._resolvedValue = value;
    this._promiseResolved( index, ret );
};
//override
SettledPromiseArray.prototype._promiseRejected =
function SettledPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    ASSERT( typeof index === "number" );
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = IS_REJECTED;
    ret._resolvedValue = reason;
    this._promiseResolved( index, ret );
};

return SettledPromiseArray;})();
