"use strict";
module.exports = function( Promise, PromiseArray ) {
var util = require("./util.js");
var inherits = util.inherits;
// the PromiseArray to use with Promise.race method
function RacePromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( RacePromiseArray, PromiseArray );

//override
RacePromiseArray.prototype._init =
function RacePromiseArray$_init() {
    this._init$(void 0, RESOLVE_FOREVER_PENDING);
};

//override
RacePromiseArray.prototype._promiseFulfilled =
function RacePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    this._fulfill( value );

};
//override
RacePromiseArray.prototype._promiseRejected =
function RacePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    this._reject( reason );
};

return RacePromiseArray;
};
