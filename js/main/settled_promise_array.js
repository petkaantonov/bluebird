var PromiseArray = require( "./promise_array.js" );
var PromiseInspection = require( "./promise_inspection.js" );
var util = require("./util.js");
var inherits = util.inherits;
function SettledPromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( SettledPromiseArray, PromiseArray );

SettledPromiseArray.prototype._promiseResolved =
function SettledPromiseArray$_promiseResolved( index, inspection ) {
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

SettledPromiseArray.prototype._promiseFulfilled =
function SettledPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._resolvedValue = value;
    this._promiseResolved( index, ret );
};
SettledPromiseArray.prototype._promiseRejected =
function SettledPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._resolvedValue = reason;
    this._promiseResolved( index, ret );
};

module.exports = SettledPromiseArray;
