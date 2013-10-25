"use strict";
var ASSERT = require("./assert.js");
var inherits = require( "./util.js").inherits;

var rignore = new RegExp(
    "\\b(?:Promise(?:Array|Spawn)?\\$_\\w+|tryCatch(?:1|2|Apply)|setTimeout" +
    "|makeNodePromisified|processImmediate|nextTick" +
    "|Async\\$\\w+)\\b"
);

var rtraceline = null;
var formatStack = null;

function CapturedTrace( ignoreUntil, isTopLevel ) {
    this.captureStackTrace( ignoreUntil, isTopLevel );

}
inherits( CapturedTrace, Error );

CapturedTrace.prototype.captureStackTrace =
function CapturedTrace$captureStackTrace( ignoreUntil, isTopLevel ) {
    captureStackTrace( this, ignoreUntil, isTopLevel );
};

CapturedTrace.possiblyUnhandledRejection =
function CapturedTrace$PossiblyUnhandledRejection( reason ) {
    if( typeof console === "object" ) {
        var stack = reason.stack;
        var message = "Possibly unhandled " + formatStack( stack, reason );
        if( typeof console.error === "function" ) {
            console.error( message );
        }
        else if( typeof console.log === "function" ) {
            console.log( message );
        }
    }
};

CapturedTrace.combine = function CapturedTrace$Combine( current, prev ) {
    var curLast = current.length - 1;
    for( var i = prev.length - 1; i >= 0; --i ) {
        var line = prev[i];
        if( current[ curLast ] === line ) {
            current.pop();
            curLast--;
        }
        else {
            break;
        }
    }
    current.push( "From previous event:" );
    var lines = current.concat( prev );

    var ret = [];


    for( var i = 0, len = lines.length; i < len; ++i ) {

        if( ( rignore.test( lines[i] ) ||
            ( i > 0 && !rtraceline.test( lines[i] ) ) &&
            lines[i] !== "From previous event:" )
        ) {
            continue;
        }
        ret.push( lines[i] );
    }
    return ret;
};

CapturedTrace.isSupported = function CapturedTrace$IsSupported() {
    return typeof captureStackTrace === "function";
};

var captureStackTrace = (function stackDetection() {
    function formatNonError( obj ) {
        var str = obj.toString();
        if( str === "[object Object]") {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch( e ) {

            }
        }
        return ("(<" + str + ">, no stack trace)");
    }

    if( typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function" ) {
        rtraceline = /^\s*at\s*/;
        formatStack = function( stack, error ) {
            if( typeof stack === "string" ) return stack;

            if( error.name !== void 0 &&
                error.message !== void 0 ) {
                return error.name + ". " + error.message;
            }
            return formatNonError( error );


        };
        var captureStackTrace = Error.captureStackTrace;
        return function CapturedTrace$_captureStackTrace(
            receiver, ignoreUntil, isTopLevel ) {
            var prev = -1;
            if( !isTopLevel ) {
                prev = Error.stackTraceLimit;
                Error.stackTraceLimit =
                    Math.max(1, Math.min(10000, prev) / 3 | 0);
            }
            captureStackTrace( receiver, ignoreUntil );

            if( !isTopLevel ) {
                Error.stackTraceLimit = prev;
            }
        };
    }
    var err = new Error();

    if( typeof err.stack === "string" &&
        typeof "".startsWith === "function" &&
        ( err.stack.startsWith("stackDetection@")) &&
        stackDetection.name === "stackDetection" ) {

        Object.defineProperty( Error, "stackTraceLimit", {
            writable: true,
            enumerable: false,
            configurable: false,
            value: 25
        });
        rtraceline = /@/;
        var rline = /[@\n]/;

        formatStack = function( stack, error ) {
            if( typeof stack === "string" ) {
                return ( error.name + ". " + error.message + "\n" + stack );
            }

            if( error.name !== void 0 &&
                error.message !== void 0 ) {
                return error.name + ". " + error.message;
            }
            return formatNonError( error );
        };

        return function captureStackTrace(o, fn) {
            var name = fn.name;
            var stack = new Error().stack;
            var split = stack.split( rline );
            var i, len = split.length;
            for (i = 0; i < len; i += 2) {
                if (split[i] === name) {
                    break;
                }
            }
            split = split.slice(i + 2);
            len = split.length - 2;
            var ret = "";
            for (i = 0; i < len; i += 2) {
                ret += split[i];
                ret += "@";
                ret += split[i + 1];
                ret += "\n";
            }
            o.stack = ret;
        };
    }
    else {
        return null;
    }
})();

module.exports = CapturedTrace;
