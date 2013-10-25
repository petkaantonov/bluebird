"use strict";
var ASSERT = require("./assert.js");
var Promise = require("./get_promise.js").get();
var PromiseArray = require( "./promise_array.js" );
var util = require("./util.js");
var inherits = util.inherits;

function PropertiesPromiseArray( obj, caller, boundTo ) {
    var keys = Object.keys( obj );
    var values = new Array( keys.length );
    for( var i = 0, len = values.length; i < len; ++i ) {
        values[i] = obj[keys[i]];
    }
    this.constructor$( values, caller, boundTo );
    if( !this._isResolved() ) {
        for( var i = 0, len = keys.length; i < len; ++i ) {
            values.push( keys[i] );
        }
    }
}
inherits( PropertiesPromiseArray, PromiseArray );

PropertiesPromiseArray.prototype._init =
function PropertiesPromiseArray$_init() {
    this._init$( void 0, 2 ) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled =
function PropertiesPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    this._values[ index ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        var val = {};
        var keyOffset = this.length();
        for( var i = 0, len = this.length(); i < len; ++i ) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._fulfill( val );
    }
};

PropertiesPromiseArray.prototype._promiseProgressed =
function PropertiesPromiseArray$_promiseProgressed( value, index ) {
    if( this._isResolved() ) return;

    this._resolver.progress({
        key: this._values[ index + this.length() ],
        value: value
    });
};

PromiseArray.PropertiesPromiseArray = PropertiesPromiseArray;

module.exports = PropertiesPromiseArray;
