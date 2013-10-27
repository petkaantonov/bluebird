"use strict";
var global = require("./global.js");
var util = require( "./util.js");
var inherits = util.inherits;
var isObject = util.isObject;
var notEnumerableProp = util.notEnumerableProp;

function isStackAttached( val ) {
    return ( val & STACK_ATTACHED ) > 0;
}

function isHandled( val ) {
    return ( val & ERROR_HANDLED ) > 0;
}

function withStackAttached( val ) {
    return ( val | STACK_ATTACHED );
}

function withHandledMarked( val ) {
    return ( val | ERROR_HANDLED );
}

function withHandledUnmarked( val ) {
    return ( val & ( ~ERROR_HANDLED ) );
}

function ensureNotHandled( reason ) {
    var field;
    if( isObject( reason ) &&
        ( ( field = reason[ERROR_HANDLED_KEY] ) !== void 0 ) ) {
        reason[ERROR_HANDLED_KEY] = withHandledUnmarked( field );
    }
}

function attachDefaultState( obj ) {
    try {
        notEnumerableProp( obj, ERROR_HANDLED_KEY, DEFAULT_STATE );
        return true;
    }
    catch( e ) {
        return false;
    }
}

function isError( obj ) {
    return obj instanceof Error;
}

function canAttach( obj ) {
    if( isError( obj ) ) {
        var handledState = obj[ERROR_HANDLED_KEY];
        if( handledState === void 0 ) {
            return attachDefaultState( obj );
        }
        return !isStackAttached( handledState );
    }
    return false;
}

function subError( nameProperty, defaultMessage ) {
    function SubError( message ) {
        this.message = typeof message === "string" ? message : defaultMessage;
        this.name = nameProperty;
        if( Error.captureStackTrace ) {
            Error.captureStackTrace( this, this.constructor );
        }
    }
    inherits( SubError, Error );
    return SubError;
}

var TypeError = global.TypeError;
if( typeof TypeError !== "function" ) {
    TypeError = subError( "TypeError", "type error" );
}
var CancellationError = subError( "CancellationError", "cancellation error" );
var TimeoutError = subError( "TimeoutError", "timeout error" );

module.exports = {
    TypeError: TypeError,
    CancellationError: CancellationError,
    TimeoutError: TimeoutError,
    attachDefaultState: attachDefaultState,
    ensureNotHandled: ensureNotHandled,
    withHandledUnmarked: withHandledUnmarked,
    withHandledMarked: withHandledMarked,
    withStackAttached: withStackAttached,
    isStackAttached: isStackAttached,
    isHandled: isHandled,
    canAttach: canAttach
};