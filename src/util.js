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

//Layout
//00RF NCLL LLLL LLLL LLLL LLLL LLLL LLLL
//0 = Always 0 (never used)
//R = [Reserved]
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved
%constant(IS_FULFILLED, 0x10000000);
%constant(IS_REJECTED, 0x8000000);
%constant(IS_REJECTED_OR_FULFILLED, 0x18000000);
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

function makeNodePromisified( callback, receiver ) {

    function getCall(count) {
        var args = new Array(count);
        for( var i = 0, len = args.length; i < len; ++i ) {
            args[i] = "a" + (i+1);
        }
        var comma = count > 0 ? "," : "";
        return ( receiver === void 0
            ? "callback("+args.join(",")+ comma +" fn);"
            : "callback.call(receiver, "+args.join(",") + comma + " fn);" ) +
        "break;";
    }

    return new Function("Promise", "callback", "receiver",
        "return function promisifed( a1, a2, a3, a4, a5 ) {" +
        "var len = arguments.length;" +
        "var resolver = Promise.pending();" +
        "" +
        "var fn = function( err, value ) {" +
        "if( err ) {" +
        "resolver.reject( err );" +
        "}" +
        "else {" +
        "resolver.fulfill( value );" +
        "}" +
        "};" +
        "switch( len ) {" +
        "case 5:" + getCall(5) +
        "case 4:" + getCall(4) +
        "case 3:" + getCall(3) +
        "case 2:" + getCall(2) +
        "case 1:" + getCall(1) +
        "case 0:" + getCall(0) +
        "default: callback.apply(receiver, arguments); break;" +
        "}" +
        "return resolver.promise;" +
        "" +
        "};"
    )(Promise, callback, receiver);
}


//Un-magical enough that using this doesn't prevent
//extending classes from outside using any convention
var inherits = function( Child, Parent ) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call( Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
            ) {
                this[ propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};
