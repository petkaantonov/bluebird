//This is the only way to have efficient constants
%constant(FUNCTION_OFFSET, 0);
%constant(RECEIVER_OFFSET, 1);
%constant(ARGUMENT_OFFSET, 2);
%constant(FUNCTION_SIZE, 3);

%constant(CALLBACK_FULFILL_OFFSET, 0);
%constant(CALLBACK_REJECT_OFFSET, 1);
%constant(CALLBACK_PROGRESS_OFFSET, 2);
%constant(CALLBACK_PROMISE_OFFSET, 3);
%constant(CALLBACK_RECEIVER_OFFSET, 4);
%constant(CALLBACK_SIZE, 5);

%constant(TYPE_ERROR_INFINITE_CYCLE, "Circular thenable chain");
%constant(TOO_MANY_PARALLEL_HANDLERS, "Too many parallel handlers");

//Layout
//00RF NCLL LLLL LLLL LLLL LLLL LLLL LLLL
//R = isResolved
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved
//0 = Always 0 (never used)
%constant(IS_RESOLVED, 0x20000000);
%constant(IS_FULFILLED, 0x10000000);
%constant(IS_REJECTED, 0x8000000);
%constant(IS_CANCELLABLE, 0x4000000);

%constant(LENGTH_MASK, 0x3FFFFFF);
%constant(LENGTH_CLEAR_MASK, 0x3C000000);
%constant(MAX_LENGTH, 0x3FFFFFF);

var errorObj = {e: {}};
var UNRESOLVED = {};
var noop = function(){};
var rescape = /[\r\n\u2028\u2029']/g;

var replacer = function( ch ) {
        return "\\u" + (("0000") +
            (ch.charCodeAt(0).toString(16))).slice(-4);
};


function safeToEmbedString( str ) {
    return str.replace( rescape, replacer );
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
        errorObj.e = e;
        return errorObj;
    }
}

function tryCatch2( fn, receiver, arg, arg2 ) {
    try {
        return fn.call( receiver, arg, arg2 );
    }
    catch( e ) {
        errorObj.e = e;
        return errorObj;
    }
}


var create = Object.create || function( proto ) {
    function F(){}
    F.prototype = proto;
    return new F();
};
