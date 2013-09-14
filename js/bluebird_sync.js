/* jshint -W014, -W116 */
/* global process, unreachable */
/**
 * @preserve Copyright (c) 2013 Petka Antonov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function( global, Function, Array, Error, Object ) { "use strict";

var errorObj = {e: {}};
var rescape = /[\r\n\u2028\u2029']/g;

var replacer = function( ch ) {
        return "\\u" + (("0000") +
            (ch.charCodeAt(0).toString(16))).slice(-4);
};

function safeToEmbedString( str ) {
    return str.replace( rescape, replacer );
}

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

function tryCatchApply( fn, args ) {
    try {
        return fn.apply( void 0, args );
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

function subError( constructorName, nameProperty, defaultMessage ) {
    defaultMessage = safeToEmbedString("" + defaultMessage );
    nameProperty = safeToEmbedString("" + nameProperty );

    return new Function("create", "'use strict';\n" +
         constructorName + ".prototype = create(Error.prototype);" +
         constructorName + ".prototype.constructor = "+constructorName+";" +
        "function "+constructorName+"(msg){" +
        "if( Error.captureStackTrace ) {" +
        "Error.captureStackTrace(this, this.constructor);" +
        "}" +
        "Error.call(this, msg);" +
        "this.message = typeof msg === 'string'" +
        "? msg" +
        ": '"+defaultMessage+"';" +
        "this.name = '"+nameProperty+"';" +
        "} return "+constructorName+";")(create);
}

var TypeError = subError( "TypeError", "TypeError" );
var CancellationError = subError( "CancellationError",
    "Cancel", "cancellation error" );
var TimeoutError = subError( "TimeoutError", "Timeout", "timeout error" );


function GetterCache(){}
function FunctionCache(){}


var getterCache = new GetterCache(),
    functionCache = new FunctionCache(),
    rjsident = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/,
    rkeyword = new RegExp(
        "^(?:__proto__|undefined|NaN|Infinity|this|false|true|null|eval|" +
        "arguments|break|case|catch|continue|debugger|default|delete|do|" +
        "else|finally|for|function|if|in|instanceof|new|return|switch|th" +
        "row|try|typeof|var|void|while|with|class|enum|export|extends|im" +
        "port|super|implements|interface|let|package|private|protected|pu" +
        "blic|static|yield)$"
    ),
    hasProp = {}.hasOwnProperty;



function isJsIdentifier( val ) {
    return rjsident.test(val) &&
        !rkeyword.test(val);
}

function formatPropertyRead( val ) {
    if( isJsIdentifier(val) ) {
        return "." + val;
    }
    else {
        return "['"+safeToEmbedString(val)+"']";
    }
}

function getGetter( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return getterCache[propertyName];
    }
    var fn = new Function("obj", "return obj"+
        formatPropertyRead(""+propertyName)
    +";");
    getterCache[propertyName] = fn;
    return fn;
}

function getFunction( propertyName ) {
    if( hasProp.call( functionCache, propertyName ) ) {
        return functionCache[propertyName];
    }
    var fn = new Function("obj", "return obj"+
        formatPropertyRead(""+propertyName)
    +"();");
    functionCache[propertyName] = fn;
    return fn;
}
var Async = (function() {

var deferFn = typeof process !== "undefined" ?
    ( typeof global.setImmediate !== "undefined"
        ? function( fn ){
            global.setImmediate( fn );
          }
        : function( fn ) {
            process.nextTick( fn );
        }

    ) :
    ( typeof setTimeout !== "undefined"
        ? function( fn ) {
            setTimeout( fn, 4 );
        }
        : function( fn ) {
            fn();
        }
) ;


function Async() {
    this._isTickUsed = false;
    this._length = 0;
    this._backupBuffer = [];
    var functionBuffer = this._functionBuffer = new Array( 1000 * 3 );
    var self = this;
    this.consumeFunctionBuffer = function() {
        self._consumeFunctionBuffer();
    };

    for( var i = 0, len = functionBuffer.length; i < len; ++i ) {
        functionBuffer[i] = void 0;
    }
}
var method = Async.prototype;

method.invokeLater = function( fn, receiver, arg ) {
    if( !this._isTickUsed ) {
        this.invoke( fn, receiver, arg );
        return;
    }
    this._backupBuffer.push( fn, receiver, arg );
};

method.invoke = function( fn, receiver, arg ) {
    var functionBuffer = this._functionBuffer,
        len = functionBuffer.length,
        length = this._length;

    if( length === len ) {
        functionBuffer.push( fn, receiver, arg );
    }
    else {
        functionBuffer[ length + 0 ] = fn;
        functionBuffer[ length + 1 ] = receiver;
        functionBuffer[ length + 2 ] = arg;
    }
    this._length = length + 3;

    if( !this._isTickUsed ) {
        deferFn( this.consumeFunctionBuffer );
        this._isTickUsed = true;
    }
};

method._consumeFunctionBuffer = function() {
    var functionBuffer = this._functionBuffer;
    for( var i = 0; i < this._length; i += 3 ) {
        functionBuffer[ i + 0 ].call(
            functionBuffer[ i + 1 ],
            functionBuffer[ i + 2 ] );

        functionBuffer[ i + 0 ] =
            functionBuffer[ i + 1 ] =
            functionBuffer[ i + 2 ] =
            void 0;
    }
    this._reset();
    if( this._backupBuffer.length ) {
        var buffer = this._backupBuffer;
        for( var i = 0, len = buffer.length; i < len; i+= 3 ) {
            buffer[ i ].call( buffer[ i + 1 ] , buffer[ i + 2 ] );
        }
        buffer.length = 0;
    }
};

method._reset = function() {
    this._isTickUsed = false;
    this._length = 0;
};

method.haveItemsQueued = function() {
    return this._length > 0;
};


return Async;})();

var async = new Async();

var bindDefer = function bindDefer( fn, receiver ) {
    return function deferBound( arg ) {
        fn.call(receiver, arg);
    };
};

var Promise = (function() {

function isThenable( ret, ref ) {
    try {
        var then = ret.then;
        if( typeof then === "function" ) {
            ref.ref = then;
            return true;
        }
        return false;
    }
    catch(e) {
        errorObj.e = e;
        ref.ref = errorObj;
        return true;
    }
}

function combineTraces( current, prev ) {
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
    var lines = current.concat( prev );
    var ret = [];
    var rignore = new RegExp(
        "\\b(?:Promise\\.method|tryCatch(?:1|2|Apply)|setTimeout" +
        "|makeNodePromisified|processImmediate|nextTick" +
        "|_?consumeFunctionBuffer)\\b"
    );
    var rtrace = /^\s*at\s*/;
    for( var i = 0, len = lines.length; i < len; ++i ) {
        if( rignore.test( lines[i] ) ||
            ( i > 0 && !rtrace.test( lines[i] ) )
        ) {
            continue;
        }
        ret.push( lines[i] );
    }
    return ret;
}

var possiblyUnhandledRejection = function( reason ) {
    if( typeof console === "object" ) {
        var stack = reason.stack;
        var message = "Possibly unhandled ";
        if( typeof stack === "string" ) {
            message += stack;
        }
        else {
            message += reason.name + ". " + reason.message;
        }

        if( typeof console.error === "function" ) {
            console.error( message );
        }
        else if( typeof console.log === "function" ) {
            console.log( message );
        }
    }
};

function isObject( value ) {
    if( value === null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" );
}

function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

var Err = Error;
function isError( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Err;
}

var Arr = Array;
var isArray = Arr.isArray || function( obj ) {
    return obj instanceof Arr;
};


var APPLY = {};
var UNRESOLVED = {};
var noop = function(){};

function CapturedTrace() {
    var e = Error.stackTraceLimit;
    Error.stackTraceLimit = e + 7;
    Error.captureStackTrace( this, this.constructor );
    Error.stackTraceLimit = e;
}
inherits( CapturedTrace, Error );

function Promise( resolver ) {
    if( typeof resolver === "function" )
        this._resolveResolver( resolver );
    this._bitField = 0x4000000;

    this._fulfill0 =
    this._reject0 =
    this._progress0 =
    this._promise0 =
    this._receiver0 =
        void 0;
    this._resolvedValue = UNRESOLVED;
    this._cancellationParent = null;
}
var method = Promise.prototype;

var longStackTraces = false;
Promise.longStackTraces = function() {
    if( async.haveItemsQueued() ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

method.toString = function() {
    return "[object Promise]";
};


method.caught = method["catch"] = function( fn ) {
    return this._then( void 0, fn, void 0, void 0, void 0 );
};

method.progressed = function( fn ) {
    return this._then( void 0, void 0, fn, void 0, void 0 );
};

method.resolved = function( fn ) {
    return this._then( fn, fn, void 0, void 0, void 0 );
};

method.inspect = function() {
    return new PromiseInspection( this );
};

method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    if( cancelTarget === this ) {
        this._reject(new CancellationError());
    }
    else {
        cancelTarget.cancel((void 0));
    }
    return this;
};

method.uncancellable = function() {
    var ret = new Promise();
    ret._unsetCancellable();
    ret._assumeStateOf( this, true );
    return ret;
};

method.fork = function( didFulfill, didReject, didProgress ) {
    var ret = this.then( didFulfill, didReject, didProgress );
    ret._cancellationParent = null;
    return ret;
};

method.call = function( propertyName ) {
    var len = arguments.length;

    if( len < 2 ) {
        return this._callFast( propertyName );
    }
    else {
        var args = new Array(len-1);
        for( var i = 1; i < len; ++i ) {
            args[ i - 1 ] = arguments[ i ];
        }
        return this._callSlow( propertyName, args );
    }

};

method.get = function( propertyName ) {
    return this.then( getGetter( propertyName ) );
};

method.then = function( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress, void 0, void 0 );
};

method.spread = function( didFulfill ) {
    return this._then( didFulfill, void 0, void 0, APPLY, void 0 );
};
method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

method.isPending = function() {
    return !this.isResolved();
};

method.isResolved = function() {
    return ( this._bitField & 0x18000000 ) > 0;
};

method.isCancellable = function() {
    return !this.isResolved() &&
        this._cancellable();
};

method.map = function( fn ) {
    return Promise.map( this, fn );
};

method.all = function() {
    return Promise.all( this );
};

method.any = function() {
    return Promise.any( this );
};

method.settle = function() {
    return Promise.settle( this );
};

method.some = function( count ) {
    return Promise.some( this, count );
};

method.reduce = function( fn, initialValue ) {
    return Promise.reduce( this, fn, initialValue );
};

Promise.is = isPromise;

function all( promises, PromiseArray ) {
    if( isPromise( promises ) ||
        isArray( promises ) ) {
        return new PromiseArray( promises );
    }
    throw new TypeError("expecting an array or a promise");
}

Promise.settle = function( promises ) {
    var ret = all( promises, SettledPromiseArray );
    return ret.promise();
};

Promise.all = function( promises ) {
    var ret = all( promises, PromiseArray );
    return ret.promise();
};

Promise.join = function() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise.all( ret );
};

Promise.any = function( promises ) {
    var ret = all( promises, AnyPromiseArray );
    return ret.promise();
};

Promise.some = function( promises, howMany ) {
    var ret = all( promises, SomePromiseArray );
    if( ( howMany | 0 ) !== howMany ) {
        throw new TypeError("howMany must be an integer");
    }
    var len = ret.length();
    howMany = Math.max(0, Math.min( howMany, len ) );
    ret._howMany = howMany;
    return ret.promise();
};


function mapper( fulfilleds ) {
    var fn = this;
    var shouldDefer = false;
    for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
        var fulfill = fn(fulfilleds[i]);
        if( !shouldDefer && isPromise( fulfill ) ) {
            if( fulfill.isFulfilled() ) {
                fulfilleds[i] = fulfill._resolvedValue;
                continue;
            }
            else {
                shouldDefer = true;
            }
        }
        fulfilleds[i] = fulfill;
    }
    return shouldDefer ? Promise.all( fulfilleds ) : fulfilleds;
}
Promise.map = function( promises, fn ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function" );
    return Promise.all( promises )._then(
        mapper,
        void 0,
        void 0,
        fn,
        void 0
    );
};

function reducer( fulfilleds, initialValue ) {
    var fn = this;
    var len = fulfilleds.length;
    var accum;
    var startIndex = 0;

    if( initialValue !== void 0 ) {
        accum = initialValue;
        startIndex = 0;
    }
    else {
        accum = len > 0 ? fulfilleds[0] : void 0;
        startIndex = 1;
    }
    for( var i = startIndex; i < len; ++i ) {
        accum = fn( accum, fulfilleds[i], i, len );
    }
    return accum;
}

function slowReduce( promises, fn, initialValue ) {
    return Promise.all( promises ).then( function( fulfilleds ) {
        return reducer.call( fn, fulfilleds, initialValue );
    });
}


Promise.reduce = function( promises, fn, initialValue ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function");
    if( initialValue !== void 0 ) {
        return slowReduce( promises, fn, initialValue );
    }
    return Promise
        .all( promises )        ._then( reducer, void 0, void 0, fn, void 0 );
};

Promise.fulfilled = function( value ) {
    var ret = new Promise();
    ret._fulfill( value );
    return ret;
};

Promise.rejected = function( reason ) {
    var ret = new Promise();
    ret._reject( reason );
    return ret;
};

Promise.pending = function() {
    return new PromiseResolver( new Promise() );
};


Promise.cast = function( obj ) {
    if( isObject( obj ) ) {
        var ref = {ref: null};
        if( isThenable( obj, ref ) ) {
            var resolver = Promise.pending();
            ref.ref.call(obj, function( a ) {
                resolver.fulfill( a );
            }, function( a ) {
                resolver.reject( a );
            });
            return resolver.promise;
        }
    }
    return Promise.fulfilled( obj );
};

Promise.onPossiblyUnhandledRejection = function( fn ) {
    if( typeof fn === "function" ) {
        possiblyUnhandledRejection = fn;
    }
    else {
        possiblyUnhandledRejection = noop;
    }
};

Promise.promisify = function( callback, receiver) {
    return makeNodePromisified( callback, receiver );
};

method._then = function( didFulfill, didReject, didProgress, receiver,
    internalData ) {
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise();

    if( longStackTraces ) {
        ret._trace = new CapturedTrace();
        ret._traceParent = this;
    }

    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        this._resolveLast(callbackIndex);
    }
    else if( !haveInternalData && this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    return ret;
};

method._length = function() {
    return this._bitField & 0x3FFFFFF;
};

method._setLength = function( len ) {
    this._bitField = ( this._bitField & 0x3C000000 ) |
        ( len & 0x3FFFFFF ) ;
};

method._cancellable = function() {
    return ( this._bitField & 0x4000000 ) > 0;
};

method._setFulfilled = function() {
    this._bitField = this._bitField | 0x10000000;
};

method._setRejected = function() {
    this._bitField = this._bitField | 0x8000000;
};

method._setCancellable = function() {
    this._bitField = this._bitField | 0x4000000;
};

method._unsetCancellable = function() {
    this._bitField = this._bitField & ( ~0x4000000 );
};

method._receiverAt = function( index ) {
    if( index === 0 ) return this._receiver0;
    return this[ index + 4 - 5 ];
};

method._promiseAt = function( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + 3 - 5 ];
};

method._fulfillAt = function( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + 0 - 5 ];
};

method._rejectAt = function( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + 1 - 5 ];
};

method._progressAt = function( index ) {
    if( index === 0 ) return this._progress0;
    return this[ index + 2 - 5 ];
};

method._resolveResolver = function( resolver ) {
    var p = new PromiseResolver( this );
    var r = tryCatch1( resolver, this, p );
    if( r === errorObj ) {
        p.reject( r.e );
    }
};

method._addCallbacks = function(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    fulfill = typeof fulfill === "function" ? fulfill : noop;
    reject = typeof reject === "function" ? reject : noop;
    progress = typeof progress === "function" ? progress : noop;
    var index = this._length();

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._progress0 = progress;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength( index + 5 );
        return index;
    }

    this[ index - 5 + 0 ] = fulfill;
    this[ index - 5 + 1 ] = reject;
    this[ index - 5 + 2 ] = progress;
    this[ index - 5 + 3 ] = promise;
    this[ index - 5 + 4 ] = receiver;

    this._setLength( index + 5 );
    return index;
};

method._callFast = function( propertyName ) {
    return this.then( getFunction( propertyName ) );
};

method._callSlow = function( propertyName, args ) {
    return this.then( function( obj ) {
        return obj[propertyName].apply( obj, args );
    });
};

method._resolveLast = function( index ) {
    var promise = this._promiseAt( index );
    var receiver = this._receiverAt( index );
    var fn;

    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else if( this.isRejected() ) {
        fn = this._rejectAt( index );
    }
    else unreachable();

    var obj = this._resolvedValue;
    var ret = obj;
    if( fn !== noop ) {
        this._resolvePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._spreadSlowCase = function( targetFn, promise, values ) {
    promise._assumeStateOf(
        Promise.all( values )._then( targetFn, void 0, void 0, APPLY, void 0),
        false
    );
};

method._resolvePromise = function(
    onFulfilledOrRejected, receiver, value, promise
) {
    if( isError( value ) ) {
        value.__handled = true;
    }

    if( !isPromise( promise ) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x;
    if( receiver === APPLY ) {
        if( isArray( value ) ) {
            for( var i = 0, len = value.length; i < len; ++i ) {
                if( isPromise( value[i] ) ) {
                    this._spreadSlowCase(
                        onFulfilledOrRejected,
                        promise,
                        value
                    );
                    return;
                }
            }
            x = tryCatchApply( onFulfilledOrRejected, value );
        }
        else {
            this._spreadSlowCase( onFulfilledOrRejected, promise, value );
            return;
        }

    }
    else {
        x = tryCatch1( onFulfilledOrRejected, receiver, value );
    }

    if( x === errorObj ) {
        promise._attachExtraTrace( x.e );
        promise._reject(x.e);
    }
    else if( x === promise ) {
        promise._reject(new TypeError("Circular thenable chain"));
    }
    else {
        var ref;
        if( promise._tryAssumeStateOf( x, true ) ) {
            return;
        }
        else if( isObject( x ) && isThenable( x, ref = {ref: null} ) ) {
            if( ref.ref === errorObj ) {
                promise._attachExtraTrace( ref.ref.e );
                promise._reject(ref.ref.e);
            }
            else {
                var then = ref.ref;
                var threw = tryCatch2(
                        then,
                        x,
                        bindDefer( promise._fulfill, promise ),
                        bindDefer( promise._reject, promise )
                );
                if( threw === errorObj ) {
                    promise._attachExtraTrace( threw.e );
                    promise._reject(threw.e);
                }
            }
        }
        else {
            promise._fulfill(x);
        }
    }
};

method._assumeStateOf = function( promise, mustAsync ) {
    if( promise.isPending() ) {
        if( promise._cancellable()  ) {
            this._cancellationParent = promise;
        }
        promise._then(
            this._fulfill,
            this._reject,
            this._progress,
            this,
            void 0
        );
    }
    else if( promise.isFulfilled() ) {
        if( mustAsync )
            this._fulfill(promise._resolvedValue);
        else
            this._fulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync )
            this._reject(promise._resolvedValue);
        else
            this._reject( promise._resolvedValue );
    }
};

method._tryAssumeStateOf = function( value, mustAsync ) {
    if( !isPromise( value ) ) return false;
    this._assumeStateOf( value, mustAsync );
    return true;
};

method._resolveFulfill = function( value ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        var receiver = this._receiverAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                receiver,
                value,
                promise
            );

        }
        else {
            promise._fulfill(value);
        }
    }
};

method._resolveReject = function( reason ) {
    var len = this._length();
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._rejectAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            rejectionWasHandled = true;
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
                reason,
                promise
            );
        }
        else {
            if( !rejectionWasHandled )
                rejectionWasHandled = promise._length() > 0;
            promise._reject(reason);
        }
    }
    if( !rejectionWasHandled &&
        isError( reason ) &&
        possiblyUnhandledRejection !== noop

    ) {
        if( reason.__handled !== true ) {
            reason.__handled = false;
            this._unhandledRejection(reason);
        }
    }

};

method._attachExtraTrace = function( error ) {
    if( longStackTraces &&
        error !== null && typeof error === "object" ) {
        var promise = this;
        var stack = isError( error ) ? error.stack.split("\n") : [];
        var uselessLineCount = isError( error ) ? 1 : 0;

        while( promise != null &&
            promise._trace != null ) {
            stack = combineTraces( stack, promise._trace.stack.split("\n") );
            promise = promise._traceParent;
        }

        var max = Error.stackTraceLimit + uselessLineCount;
        var len = stack.length;
        if( len  > max ) {
            stack.length = max;
        }
        if( stack.length <= uselessLineCount ) {
            error.stack = "(No stack trace)";
        }
        else {
            error.stack = stack.join("\n");
        }
    }
};

method._notifyUnhandledRejection = function( reason ) {
    if( !reason.__handled ) {
        reason.__handled = true;
        possiblyUnhandledRejection( reason );
    }
};

method._unhandledRejection = function( reason ) {
    if( !reason.__handled ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

method._cleanValues = function() {
    this._cancellationParent = null;
};

method._fulfill = function( value ) {
    if( this.isResolved() ) return;
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    this._resolveFulfill( value );

};

method._reject = function( reason ) {
    if( this.isResolved() ) return;
    this._setRejected();
    this._resolvedValue = reason;
    this._resolveReject( reason );
    this._cleanValues();
};

method._progress = function( progressValue ) {
    if( this.isResolved() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        if( !isPromise( promise ) ) {
            fn.call( this._receiverAt( i ), progressValue, promise );
            continue;
        }
        var ret = progressValue;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._receiverAt( i ), progressValue );
            if( ret === errorObj ) {
                if( ret.e != null &&
                    ret.e.name === "StopProgressPropagation" ) {
                    ret.e.__handled = true;
                }
                else {
                    promise._attachExtraTrace( ret.e );
                    promise._progress(ret.e);
                }
            }
            else if( isPromise( ret ) ) {
                ret._then(promise._progress, null, null, promise, void 0);
            }
            else {
                promise._progress(ret);
            }
        }
        else {
            promise._progress(ret);
        }
    }
};


if( typeof Error.stackTraceLimit !== "number" ||
    typeof Error.captureStackTrace !== "function" ) {
    Promise.longStackTraces = noop;
    possiblyUnhandledRejection = noop;
    Promise.onPossiblyUnhandledRejection = noop;
    longStackTraces = false;
}

return Promise;})();


var PromiseArray = (function() {

function nullToUndefined( val ) {
    return val === null
        ? void 0
        : val;
}

var hasOwn = {}.hasOwnProperty;
var empty = [];

function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

var Arr = Array;
var isArray = Arr.isArray || function( obj ) {
    return obj instanceof Arr;
};

function PromiseArray( values ) {
    this._values = values;
    this._resolver = Promise.pending();
    this._length = 0;
    this._totalResolved = 0;
    this._init( void 0, empty );
}
var method = PromiseArray.prototype;

method.length = function() {
    return this._length;
};

method.promise = function() {
    return this._resolver.promise;
};


method._init = function( _, fulfillValueIfEmpty ) {
    var values = this._values;
    if( isPromise( values ) ) {
        if( values.isPending() ) {
            values._then(
                this._init,
                this._reject,
                void 0,
                this,
                fulfillValueIfEmpty
            );
            return;
        }
        else if( values.isRejected() ) {
            this._reject( values._resolvedValue );
            return;
        }
        else {
            values = values._resolvedValue;
            if( !isArray( values ) ) {
                this._fulfill( nullToUndefined( fulfillValueIfEmpty ) );
                return;
            }
            this._values = values;
        }

    }
    if( !values.length ) {
        this._fulfill( nullToUndefined( fulfillValueIfEmpty ) );
        return;
    }
    var len = values.length;
    var newLen = len;
    var newValues = new Array( len );
    for( var i = 0; i < len; ++i ) {
        var promise = values[i];

        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }
        if( !isPromise( promise ) ) {
            promise = Promise.fulfilled( promise );
        }
        promise._then(
            this._promiseFulfilled,
            this._promiseRejected,
            this._promiseProgressed,

            this,            Integer.get( i )        );
        newValues[i] = promise;
    }
    this._values = newValues;
    this._length = newLen;
};

method._isResolved = function() {
    return this._values === null;
};

method._fulfill = function( value ) {
    this._values = null;
    this._resolver.fulfill( value );
};

method._reject = function( reason ) {
    this._values = null;
    this._resolver.reject( reason );
};

method._promiseProgressed = function( progressValue ) {
    if( this._isResolved() ) return;
    this._resolver.progress( progressValue );
};

method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    this._values[ index.valueOf() ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

method._promiseRejected = function( reason ) {
    if( this._isResolved() ) return;
    this._totalResolved++;
    this._reject( reason );
};

function Integer( value ) {
    this._value = value;
}

Integer.prototype.valueOf = function() {
    return this._value;
};
Integer.get = function( i ) {
    if( i < 256 ) {
        return ints[i];
    }
    return new Integer(i);
};

var ints = [];
for( var i = 0; i < 256; ++i ) {
    ints.push( new Integer(i) );
}





return PromiseArray;})();
var SettledPromiseArray = (function() {
function SettledPromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( SettledPromiseArray, PromiseArray );

method._promiseResolved = function( index, inspection ) {
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

var throwawayPromise = new Promise();
method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 0x10000000;
    ret._resolvedValue = value;
    this._promiseResolved( index.valueOf(), ret );
};
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 0x8000000;
    ret._resolvedValue = reason;
    this._promiseResolved( index.valueOf(), ret );
};

return SettledPromiseArray;})();
var AnyPromiseArray = (function() {
function AnyPromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( AnyPromiseArray, PromiseArray );


method._init = function() {
    this._init$( void 0, null );
};

method._promiseFulfilled = function( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    var totalResolved = ++this._totalResolved;
    this._values[ index.valueOf() ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();
var SomePromiseArray = (function() {
function SomePromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( SomePromiseArray, PromiseArray );

method._init = function() {
    this._init$( void 0, [] );
    this._howMany = 0;
    this._rejected = 0;
    this._rejectionValues = new Array( this.length() );
    this._resolutionValues = new Array( this.length() );
    if( this._isResolved() ) return;

    if( this._howMany > this._canPossiblyFulfill()  ) {
        this._reject( [] );
    }
};

method._canPossiblyFulfill = function() {
    return this._totalResolved - this._rejected +
        ( this.length() - this._totalResolved );
};

method._promiseFulfilled = function( value ) {
    if( this._isResolved() ) return;

    var totalResolved = this._totalResolved;
    this._resolutionValues[ totalResolved ] = value;
    this._totalResolved = totalResolved + 1;
    if( totalResolved + 1 === this._howMany ) {
        this._resolutionValues.length = this._howMany;
        this._fulfill( this._resolutionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }

};
method._promiseRejected = function( reason ) {
    if( this._isResolved() ) return;

    this._rejectionValues[ this._rejected ] = reason;
    this._rejected++;
    this._totalResolved++;

    if( this._howMany > this._canPossiblyFulfill() ) {
        this._rejectionValues.length = this._rejected;
        this._reject( this._rejectionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }
};

return SomePromiseArray;})();
var PromiseInspection = (function() {


function PromiseInspection( promise ) {
    this._bitField = promise._bitField;
    this._resolvedValue = promise.isResolved()
        ? promise._resolvedValue
        : void 0;
}
var method = PromiseInspection.prototype;

method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

method.isPending = function() {
    return ( this._bitField & 0x18000000 ) === 0;
};

method.value = function() {
    if( !this.isFulfilled() ) {
        throw new TypeError(
            "cannot get fulfillment value of a non-fulfilled promise");
    }
    return this._resolvedValue;
};

method.error = function() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};




return PromiseInspection;})();

var PromiseResolver = (function() {

function PromiseResolver( promise ) {
    this.promise = promise;
}
var method = PromiseResolver.prototype;

method.toString = function() {
    return "[object PromiseResolver]";
};

method.fulfill = function( value ) {
    if( this.promise._tryAssumeStateOf( value, false ) ) {
        return;
    }
    this.promise._fulfill(value);
};

method.reject = function( reason ) {
    this.promise._reject(reason);
};

method.progress = function( value ) {
    this.promise._progress(value);
};

method.cancel = function() {
    this.promise.cancel((void 0));
};

method.timeout = function() {
    this.promise._reject(new TimeoutError("timeout"));
};

method.isResolved = function() {
    return this._promise.isResolved();
};


return PromiseResolver;})();
if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define( "Promise", [], function(){return Promise;});
}
else {
    global.Promise = Promise;
}


return Promise;})(
    new Function("return this")(),
    Function,
    Array,
    Error,
    Object
);