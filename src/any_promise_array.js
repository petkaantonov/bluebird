"use strict";
module.exports = function( PromiseArray ) {
var ASSERT = require("./assert.js");
var util = require("./util.js");
var inherits = util.inherits;
// the PromiseArray to use with Promise.any method
function AnyPromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( AnyPromiseArray, PromiseArray );

AnyPromiseArray.prototype._init = function AnyPromiseArray$_init() {
    //.any must resolve to undefined in case of empty array
    this._init$( void 0, FULFILL_UNDEFINED );
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

return AnyPromiseArray;
};