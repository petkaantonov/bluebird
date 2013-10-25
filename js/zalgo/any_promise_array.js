"use strict";
var ASSERT = require("./assert.js");
var PromiseArray = require( "./promise_array.js" );
var util = require("./util.js");
var inherits = util.inherits;
function AnyPromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( AnyPromiseArray, PromiseArray );

AnyPromiseArray.prototype._init = function AnyPromiseArray$_init() {
    this._init$( void 0, 0 );
};

AnyPromiseArray.prototype._promiseFulfilled =
function AnyPromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
AnyPromiseArray.prototype._promiseRejected =
function AnyPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    var totalResolved = ++this._totalResolved;
    this._values[ index ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

module.exports = AnyPromiseArray;
