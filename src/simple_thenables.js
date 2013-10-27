"use strict";
module.exports = function( Promise ) {
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var async = require( "./async.js" );
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;


    function doThenable( obj, caller ) {
        var resolver = Promise.pending( caller );
        var called = false;
        var ret = tryCatch2( obj.then, obj, function( x ) {
            if( called ) return;
            called = true;
            resolver.fulfill( x );
        }, function( e ) {
            if( called ) return;
            called = true;
            resolver.reject( e );
        });
        if( ret === errorObj && !called ) {
            called = true;
            resolver.reject( ret.e );
        }
        return resolver.promise;
    }

    Promise._couldBeThenable = function( ret ) {
        if( isPrimitive( ret ) ) {
            return false;
        }
        return ("then" in ret);
    };

    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }
            else if( typeof obj.then === "function") {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return doThenable( obj, caller );
            }
        }
        return obj;
    }

    Promise.prototype._tryThenable = function Promise$_tryThenable( x ) {
        if( typeof x.then !== "function" ) {
            return false;
        }
        this._resolveThenable( x );
        return true;
    };

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable( x ) {
        var self = this;
        var called = false;

        var ret = tryCatch2(x.then, x, function( x ) {
            if( called ) return;
            called = true;
            async.invoke( self._fulfill, self, x );
        }, function( e ) {
            if( called ) return;
            called = true;
            async.invoke( self._reject, self, e );
        });
        if( ret === errorObj && !called ) {
            called = true;
            this._attachExtraTrace( ret.e );
            this._reject( ret.e );
        }
    };

    Promise._cast = Promise$_Cast;
};

