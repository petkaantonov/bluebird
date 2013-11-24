"use strict";
module.exports = function( Promise ) {
    var ASSERT = require("./assert.js");
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var async = require( "./async.js" );
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;


    function doThenable( obj, caller ) {
        var resolver = Promise.defer( caller );
        var called = false;
        var ret = tryCatch2( obj.then, obj, function( x ) {
            if( called ) return;
            called = true;
            resolver.resolve( x );
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

    function isThenable(obj, ref) {
        if (isPrimitive(obj)) {
            return false;
        }
        var then = obj.then;
        if (typeof then === "function") {
            ref.ref = then;
            return true;
        }
        return false;
    }

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

    Promise._cast = Promise$_Cast;
    Promise._isThenable = isThenable;

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable(x, then) {
        ASSERT(typeof then === "function");
        var self = this;
        var called = false;

        var ret = tryCatch2(then, x, function( x ) {
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


};

