"use strict";
module.exports = function( Promise ) {
    var THIS = {};
    var util = require( "./util.js");
    var withAppended = util.withAppended;
    var maybeWrapAsError = util.maybeWrapAsError;
    var nodebackForResolver = util.nodebackForResolver;
    var canEvaluate = util.canEvaluate;
    var notEnumerableProp = util.notEnumerableProp;
    var deprecated = util.deprecated;
    var ASSERT = require( "./assert.js" );

    function makeNodePromisifiedEval( callback, receiver, originalName ) {
        function getCall(count) {
            var args = new Array(count);
            for( var i = 0, len = args.length; i < len; ++i ) {
                args[i] = "a" + (i+1);
            }
            var comma = count > 0 ? "," : "";

            if( typeof callback === "string" &&
                receiver === THIS ) {
                return "this['" + callback + "']("+args.join(",") +
                    comma +" fn);"+
                    "break;";
            }
            return ( receiver === void 0
                ? "callback("+args.join(",")+ comma +" fn);"
                : "callback.call("+( receiver === THIS
                    ? "this"
                    : "receiver" )+", "+args.join(",") + comma + " fn);" ) +
            "break;";
        }

        function getArgs() {
            return "var args = new Array( len + 1 );" +
            "var i = 0;" +
            "for( var i = 0; i < len; ++i ) { " +
            "   args[i] = arguments[i];" +
            "}" +
            "args[i] = fn;";
        }

        var callbackName = ( typeof originalName === "string" ?
            originalName + "Async" :
            "promisified" );

        return new Function("Promise", "callback", "receiver",
                "withAppended", "maybeWrapAsError", "nodebackForResolver",
            "var ret = function " + callbackName +
            "( a1, a2, a3, a4, a5 ) {\"use strict\";" +
            "var len = arguments.length;" +
            "var resolver = Promise.pending( " + callbackName + " );" +
            "var fn = nodebackForResolver( resolver );"+
            "try{" +
            "switch( len ) {" +
            "case 1:" + getCall(1) +
            "case 2:" + getCall(2) +
            "case 3:" + getCall(3) +
            "case 0:" + getCall(0) +
            "case 4:" + getCall(4) +
            "case 5:" + getCall(5) +
            "default: " + getArgs() + (typeof callback === "string"
                ? "this['" + callback + "'].apply("
                : "callback.apply("
            ) +
                ( receiver === THIS ? "this" : "receiver" ) +
            ", args ); break;" +
            "}" +
            "}" +
            "catch(e){ " +
            "" +
            "resolver.reject( maybeWrapAsError( e ) );" +
            "}" +
            "return resolver.promise;" +
            "" +
            "}; ret.__isPromisified__ = true; return ret;"
        )(Promise, callback, receiver, withAppended,
            maybeWrapAsError, nodebackForResolver);
    }

    function makeNodePromisifiedClosure( callback, receiver ) {
        function promisified() {
            var _receiver = receiver;
            if( receiver === THIS ) _receiver = this;
            if( typeof callback === "string" ) {
                callback = _receiver[callback];
            }
            ASSERT( typeof callback === "function" );
            var resolver = Promise.pending( promisified );
            var fn = nodebackForResolver( resolver );
            try {
                callback.apply( _receiver, withAppended( arguments, fn ) );
            }
            catch(e) {
                resolver.reject( maybeWrapAsError( e ) );
            }
            return resolver.promise;
        }
        promisified.__isPromisified__ = true;
        return promisified;
    }

    var makeNodePromisified = canEvaluate
        ? makeNodePromisifiedEval
        : makeNodePromisifiedClosure;

    function f(){}
    function isPromisified( fn ) {
        return fn.__isPromisified__ === true;
    }
    var hasProp = {}.hasOwnProperty;
    var roriginal = new RegExp( BEFORE_PROMISIFIED_SUFFIX + "$" );
    function _promisify( callback, receiver, isAll ) {
        if( isAll ) {
            var changed = 0;
            var o = {};
            for( var key in callback ) {
                if( !roriginal.test( key ) &&
                    !hasProp.call( callback,
                        ( key + BEFORE_PROMISIFIED_SUFFIX ) ) &&
                    typeof callback[ key ] === "function" ) {
                    var fn = callback[key];
                    if( !isPromisified( fn ) ) {
                        changed++;
                        var originalKey = key + BEFORE_PROMISIFIED_SUFFIX;
                        var promisifiedKey = key + AFTER_PROMISIFIED_SUFFIX;
                        notEnumerableProp( callback, originalKey, fn );
                        o[ promisifiedKey ] =
                            makeNodePromisified( originalKey, THIS, key );
                    }
                }
            }
            if( changed > 0 ) {
                for( var key in o ) {
                    if( hasProp.call( o, key ) ) {
                        callback[key] = o[key];
                    }
                }
                //Right now the above loop will easily turn the
                //object into hash table in V8
                //but this will turn it back. Yes I am ashamed.
                f.prototype = callback;
            }

            return callback;
        }
        else {
            return makeNodePromisified( callback, receiver, void 0 );
        }
    }

    Promise.promisify = function Promise$Promisify( callback, receiver ) {
        if( typeof callback === "object" && callback !== null ) {
            deprecated( "Promise.promisify for promisifying entire objects " +
                "is deprecated. Use Promise.promisifyAll instead." );
            return _promisify( callback, receiver, true );
        }
        if( typeof callback !== "function" ) {
            throw new TypeError( "callback must be a function" );
        }
        if( isPromisified( callback ) ) {
            return callback;
        }
        return _promisify(
            callback,
            arguments.length < 2 ? THIS : receiver,
            false );
    };

    Promise.promisifyAll = function Promise$PromisifyAll( target ) {
        if( typeof target !== "function" && typeof target !== "object" ) {
            throw new TypeError( "Cannot promisify " + typeof target );
        }
        return _promisify( target, void 0, true );
    };
};

