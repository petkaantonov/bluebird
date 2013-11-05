"use strict";
var ensureNotHandled = require( "./errors.js" ).ensureNotHandled;
var util = require( "./util.js");
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function CatchFilter( instances, callback, promise ) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}


function safePredicate( predicate, e ) {
    var safeObject = {};
    var retfilter = tryCatch1( predicate, safeObject, e );

    if( retfilter === errorObj ) return retfilter;

    var safeKeys = Object.keys(safeObject);
    if( safeKeys.length ) {
        errorObj.e = new TypeError(
            "Catch filter must inherit from Error "
          + "or be a simple predicate function" );
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function CatchFilter$doFilter( e ) {
    var cb = this._callback;

    for( var i = 0, len = this._instances.length; i < len; ++i ) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            ( item != null && item.prototype instanceof Error );

        if( itemIsErrorType && e instanceof item ) {
            var ret = tryCatch1( cb, this._promise._boundTo, e );
            if( ret === errorObj ) {
                throw ret.e;
            }
            return ret;
        } else if( typeof item === "function" && !itemIsErrorType ) {
            var shouldHandle = safePredicate(item, e);
            if( shouldHandle === errorObj ) {
                this._promise._attachExtraTrace( errorObj.e );
                e = errorObj.e;
                break;
            } else if(shouldHandle) {
                var ret = tryCatch1( cb, this._promise._boundTo, e );
                if( ret === errorObj ) {
                    throw ret.e;
                }
                return ret;
            }
        }
    }
    ensureNotHandled( e );
    throw e;
};

module.exports = CatchFilter;
