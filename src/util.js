//This is the only way to have efficient constants
%constant(FUNCTION_OFFSET, 0);
%constant(RECEIVER_OFFSET, 1);
%constant(ARGUMENT_OFFSET, 2);
%constant(FUNCTION_SIZE, 3);

%constant(CALLBACK_FULFILL_OFFSET, 0);
%constant(CALLBACK_REJECT_OFFSET, 1);
%constant(CALLBACK_UPDATE_OFFSET, 2);
%constant(CALLBACK_PROMISE_OFFSET, 3);
%constant(CALLBACK_RECEIVER_OFFSET, 4);
%constant(CALLBACK_SIZE, 5);

var errorObj = {};
var UNRESOLVED = {};
var noop = function(){};

function indexOf( array, value ) {
    for( var i = 0, len = array.length; i < len; ++i ) {
        if( value === array[i] ) {
            return i;
        }
    }
    return -1;
}

var isArray = Array.isArray || function( obj ) {
    //yeah it won't work iframes
    return obj instanceof Array;
};

//Try catch is not supported in optimizing
//compiler, so it is isolated
function tryCatch1( fn, receiver, arg ) {
    try {
        return fn.call( receiver, arg );
    }
    catch( e ) {
        if( Promise.errorHandlingMode ===
            Promise.ErrorHandlingMode.PROMISE_ONLY &&
            !( e instanceof PromiseError ) ) {
            throw e;
        }
        errorObj.e = e;
        return errorObj;
    }
}

function isPromise( value ) {
    if( value == null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" ) &&
        typeof value.then === "function";
}

var create = Object.create || function( proto ) {
    function F(){}
    F.prototype = proto;
    return new F();
};

