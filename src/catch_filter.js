"use strict";
var ensureNotHandled = require( "./errors.js" ).ensureNotHandled;
var util = require( "./util.js");
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function CatchFilter( instances, callback, boundTo ) {
    this._instances = instances;
    this._callback = callback;
    this._boundTo = boundTo;
}
CatchFilter.prototype.doFilter = function CatchFilter$doFilter( e ) {
    if( e === null || typeof e !== "object" ) {
        throw e;
    }
    var cb = this._callback;
    for( var i = 0, len = this._instances.length; i < len; ++i ) {
        var item = this._instances[i];
        if( e instanceof item ) {
            var ret = tryCatch1( cb, this._boundTo, e );
            if( ret === errorObj ) {
                throw ret.e;
            }
            return ret;
        }
    }
    ensureNotHandled( e );
    throw e;
};

module.exports = CatchFilter;