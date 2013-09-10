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

//This is the only way to have efficient constants












//Layout
//00RF NCLL LLLL LLLL LLLL LLLL LLLL LLLL
//0 = Always 0 (never used)
//R = [Reserved]
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved









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


//If one uses sensible property names
//then the dummy constructor will give
//currently 8 more inobject properteis than
//EMPTY object literal in V8

//In other words, Promise.prototype.get
//is optimized for applications that use it
//for 1-8 properties that have identifier names
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
    var functionBuffer = this._functionBuffer = new Array( 25000 * 3 );
    var self = this;
    //Optimized around the fact that no arguments
    //need to be passed
    this.consumeFunctionBuffer = function() {
        self._consumeFunctionBuffer();
    };

    for( var i = 0, len = functionBuffer.length; i < len; ++i ) {
        functionBuffer[i] = void 0;
    }
}
var method = Async.prototype;


method.invoke = function( fn, receiver, arg ) {
    var functionBuffer = this._functionBuffer,
        len = functionBuffer.length,
        length = this._length;

    if( length === len ) {
        //direct index modifications past .length caused out of bounds
        //accesses which caused deoptimizations
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
    var len = this._length;
    var functionBuffer = this._functionBuffer;
    if( len > 0 ) {       //Must not cache the length
        for( var i = 0; i < this._length; i += 3 ) {
            functionBuffer[ i + 0 ].call(
                functionBuffer[ i + 1 ],
                functionBuffer[ i + 2 ]
            );
            //Must clear garbage immediately otherwise
            //high promotion rate is caused with long
            //sequence chains which leads to mass deoptimization
            functionBuffer[ i + 0 ] =
                functionBuffer[ i + 1 ] =
                functionBuffer[ i + 2 ] =
                void 0;
        }
        this._reset();
    }
    else this._reset();
};

method._reset = function() {
    this._isTickUsed = false;
    this._length = 0;
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
        //Retrieving the property may throw
        var then = ret.then;
        if( typeof then === "function" ) {
            //Faking a reference so that the
            //caller may read the retrieved value
            //since reading .then again might
            //return something different
            ref.ref = then;
            return true;
        }
        return false;
    }
    catch(e) {
        errorObj.e = e;
        ref.ref = errorObj;
        //This idiosyncrasy is because of how the
        //caller code is currently layed out..
        return true;
    }
}

function isObject( value ) {
    //no need to check for undefined twice
    if( value === null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" );
}

var possiblyUnhandledRejection = function( reason ) {
    if( typeof console === "object" ) {
        var stack = reason.stack;

        var message = "Possibly unhandled " + ( stack
            //The name and message will be in stack trace if it's there
            ? stack
            : reason.name + ". " + reason.message );

        if( typeof console.error === "function" ) {
            console.error( message );
        }
        else if( typeof console.log === "function" ) {
            console.log( message );
        }
    }
};


/**
 * Description.
 *
 *
 */

//Bitfield Layout
//00RF NCLL LLLL LLLL LLLL LLLL LLLL LLLL
//0 = Always 0 (must be never used)
//R = [Reserved]
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved
function Promise( resolver ) {
    if( typeof resolver === "function" )
        this._resolveResolver( resolver );
    this._bitField = 0x4000000;
    //Since most promises only have 0-1 parallel handlers
    //store the first ones directly on the object
    //This optimizes for exactly 1 parallel handler I.E. 99%
    this._fulfill0 =
    this._reject0 =
    this._progress0 =
    this._promise0 =
    this._receiver0 =
        void 0;
    //reason for rejection or fulfilled value
    this._resolvedValue = UNRESOLVED;
    //Used in cancel propagation
    this._cancellationParent = null;
}
var method = Promise.prototype;

/**
 * @return {string}
 */
method.toString = function() {
    return "[object Promise]";
};

/**
 * Convenience method for .then( fn, null, null );
 *
 * @param {Function} fn The callback to call if this promise is fulfilled
 * @return {Promise}
 */
method.fulfilled = function( fn ) {
    return this._then( fn, void 0, void 0, void 0, void 0 );
};

/**
 * Convenience method for .then( null, fn, null );
 *
 * @param {Function} fn The callback to call if this promise is rejected
 * @return {Promise}
 */
method.rejected = function( fn ) {
    return this._then( void 0, fn, void 0, void 0, void 0 );
};

/**
 * Convenience method for .then( null, null, fn );
 *
 * @param {Function} fn The callback to call if this promise is progressed
 * @return {Promise}
 */
method.progressed = function( fn ) {
    return this._then( void 0, void 0, fn, void 0, void 0 );
};

/**
 * Convenience method for .then( fn, fn );
 *
 * @param {Function} fn The callback to call when this promise is
 * either fulfilled or rejected
 * @return {Promise}
 */
method.resolved = function( fn ) {
    return this._then( fn, fn, void 0 );
};

/**
 * Synchronously inspect the state of this promise. Returns
 * A snapshot reflecting this promise's state exactly at the time of
 * call.
 *
 * If this promise is resolved, the inspection can be used to gain
 * access to this promise's rejection reason or fulfillment value
 * synchronously.
 *
 * (TODO) Based on inspection spec
 *
 * @return {PromiseInspection}
 */
method.inspect = function() {
    return new PromiseInspection( this );
};

/**
 * Cancel this promise. The cancellation will propagate
 * to farthest ancestor promise which is still pending.
 *
 * That ancestor will then be rejected with a CancellationError
 * object as the rejection reason.
 *
 * In a promise rejection handler you may check for a cancellation
 * by seeing if the reason object has `.name === "Cancel"`.
 *
 * Promises are by default cancellable. If you want to restrict
 * the cancellability of a promise before handing it out to a
 * client, call `.uncancellable()` which returns an uncancellable
 * promise.
 *
 * (TODO) Based on cancellation spec.
 *
 * @return {Promise}
 */
method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Resolved promises always have ._cancellationParent === null
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    //The propagated parent or original and had no parents
    if( cancelTarget === this ) {
        this._reject(new CancellationError());
    }
    else {
        //Have pending parents, call cancel on the oldest
        cancelTarget.cancel((void 0));
    }
    return this;
};

/**
 * Create an uncancellable promise based on this promise
 *
 * @return {Promise}
 */
method.uncancellable = function() {
    var ret = new Promise();

    ret._unsetCancellable();
    this._then(
        ret._fulfill,
        ret._reject,
        ret._progress,
        ret,
        void 0
    );
    return ret;
};

/**
 * Like .then, but cancellation of the the returned promise
 * or any of its descendant will not propagate cancellation
 * to this promise or this promise's ancestors.
 *
 * @param {=Function} didFulfill The callback to call if this promise
 *  is fulfilled.
 * @param {=Function} didReject The callback to call if this promise
 *  is rejected.
 * @param {=Function} didProgress The callback to call if this promise is
 *  notified of progress.
 * @return {Promise}
 */
method.fork = function( didFulfill, didReject, didProgress ) {
    var ret = this.then( didFulfill, didReject, didProgress );
    ret._cancellationParent = null;
    return ret;
};

/**
 * Chain this promise with a handler that will
 * call the given `propertyName` as a method on the
 * returned fulfillment value and return the result of the call.
 *
 * If more arguments are passed, those will be used as
 * respective arguments for the method call.
 *
 * Convenience method for:
 *
 * promise.then(function(value) {
 *     return value[propertyName]()
 * });
 *
 * If propertyName is a valid JS identifier and no arguments are
 * given, the call is optimized.
 *
 * @param {string} propertyName The property to call as a function.
 * @return {Promise}
 *
 */
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

/**
 * Chain this promise with a handler that will
 * read given `propertyName` on the
 * return fulfillment value.
 *
 * Convenience method for:
 *
 * promise.then(function(value) {
 *     return value[propertyName]
 * });
 *
 * If propertyName is a valid JS identifier
 * the property read is optimized.
 *
 * @param {string} propertyName The property to retrieve.
 * @return {Promise}
 *
 */
method.get = function( propertyName ) {
    return this.then( getGetter( propertyName ) );
};

/**
 *
 * (TODO promises/A+ .then())
 *
 * @param {=Function} didFulfill The callback to call if this promise
 *  is fulfilled.
 * @param {=Function} didReject The callback to call if this promise
 *  is rejected.
 * @param {=Function} didProgress The callback to call if this promise is
 *  notified of progress.
 * @return {Promise}
 *
 */
method.then = function( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress, void 0, void 0 );
};


/**
 * See if this promise is fulfilled.
 *
 * @return {boolean}
 */
method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

/**
 * See if this promise is rejected.
 *
 * @return {boolean}
 */
method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

/**
 * See if this promise is pending (not rejected and not fulfilled).
 *
 * @return {boolean}
 */
method.isPending = function() {
    return !this.isResolved();
};

/**
 * See if this promise is resolved (rejected or fulfilled).
 *
 * @return {boolean}
 */
method.isResolved = function() {
    return ( this._bitField & 0x18000000 ) > 0;
};

/**
 * See if this promise can be cancelled.
 *
 * @return {boolean}
 */
method.isCancellable = function() {
    return !this.isResolved() &&
        ( this._bitField & 0x4000000 ) > 0;
};

method._then = function( didFulfill, didReject, didProgress, receiver,
    __data ) {
    var ret = __data === void 0
        ? new Promise()
        : __data;
    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        this._resolveLast(callbackIndex);
    }
    else if( this.isCancellable() ) {
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

method._resolvePromise = function(
    onFulfilledOrRejected, receiver, value, promise
) {
    if( value instanceof Error ) {
        value.__handled = true;
    }

    //if promise is not instanceof Promise
    //it is internally smuggled data
    if( !(promise instanceof Promise) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x = tryCatch1( onFulfilledOrRejected, receiver, value );
    if( x === errorObj ) {
        promise._reject(errorObj.e);
    }
    else if( x === promise ) {
        promise._reject(new TypeError("Circular thenable chain"));
    }
    else {
        var ref;
        if( x instanceof Promise ) {
            //2. If x is a promise, adopt its state
            if( x.isCancellable() ) {
                promise._cancellationParent = x;
            }
            x._then(
                promise._fulfill,
                promise._reject,
                promise._progress,
                promise,
                void 0
            );
        }
        //3. Otherwise, if x is an object or function,
        else if( isObject( x ) && isThenable( x, ref = {ref: null} ) ) {
            //3.2 If retrieving the property x.then
            //results in a thrown exception e,
            //reject promise with e as the reason.
            if( ref.ref === errorObj ) {
                promise._reject(errorObj.e);
            }
            else {
                //3.1. Let then be x.then
                var then = ref.ref;
                //3.3 If then is a function, call it with x as this,
                //first argument resolvePromise, and
                //second argument rejectPromise
                var threw = tryCatch2(
                        then,
                        x,
                        bindDefer( promise._fulfill, promise ),
                        bindDefer( promise._reject, promise )
                );
                //3.3.4 If calling then throws an exception e,
                if( threw === errorObj ) {
                    //3.3.4.2 Otherwise, reject promise with e as the reason.
                    promise._reject(errorObj.e);
                }
            }
        }
        // 3.4 If then is not a function, fulfill promise with x.
        // 4. If x is not an object or function, fulfill promise with x.
        else {
            promise._fulfill(x);
        }
    }
};

//(TODO) this possibly needs to be done in _fulfill
method._tryAssumeStateOf = function( value ) {
    if( !( value instanceof Promise ) ) return false;
    if( value.isPending() ) {
        value._then(
            this._fulfill,
            this._reject,
            this._progress,
            this,
            void 0
        );
    }
    else if( value.isFulfilled() ) {
        this._fulfill( value._resolvedValue );
    }
    else {
        this._reject( value._resolvedValue );
    }
    return true;
};

method._resolveFulfill = function( value ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
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
        reason instanceof Error &&
        possiblyUnhandledRejection !== noop
    ) {
        //If the prop is not there, reading it
        //will cause deoptimization most likely
        //so do it at last possible moment
        if( reason.__handled !== true ) {
            reason.__handled = false;
            this._unhandledRejection(reason);
        }
    }

};

method._unhandledRejection = function( reason ) {
    if( !reason.__handled ) {
        setTimeout(function() {
            if( !reason.__handled ) {
                reason.__handled = true;
                possiblyUnhandledRejection( reason );
            }
        }, 100 );
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
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = reason;
    this._resolveReject( reason );
};

method._progress = function( progressValue ) {
    //2.5 onProgress is never called once a promise
    //has already been fulfilled or rejected.

    if( this.isResolved() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        //if promise is not instanceof Promise
        //it is internally smuggled data
        if( !(promise instanceof Promise) ) {
            fn.call( this._receiverAt( i ), progressValue, promise );
            continue;
        }
        var ret = progressValue;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._receiverAt( i ), progressValue );
            if( ret === errorObj ) {
                //2.4 if the onProgress callback throws an exception
                //with a name property equal to 'StopProgressPropagation',
                //then the error is silenced.
                if( ret.e != null &&
                    ret.e.name === "StopProgressPropagation" ) {
                    ret.e.__handled = true;
                }
                else {
                    //2.3 Unless the onProgress callback throws an exception
                    //with a name property equal to 'StopProgressPropagation',
                    // the result of the function is used as the progress
                    //value to propagate.
                    promise._progress(errorObj.e);
                }
            }
            //2.2 The onProgress callback may return a promise.
            else if( ret instanceof Promise ) {
                //2.2.1 The callback is not considered complete
                //until the promise is fulfilled.

                //2.2.2 The fulfillment value of the promise is the value
                //to be propagated.

                //2.2.3 If the promise is rejected, the rejection reason
                //should be treated as if it was thrown by the callback
                //directly.
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

/**
 * See if obj is a promise from this library. Same
 * as calling `obj instanceof Promise`.
 *
 * @param {dynamic} obj The object to check.
 * @return {boolean}
 */
Promise.is = function( obj ) {
    return obj instanceof Promise;
};

function all( promises, PromiseArray ) {
    if( promises instanceof Promise ||
        isArray( promises ) ) {
        return new PromiseArray( promises );
    }
    throw new TypeError("expecting an array or a promise");
}

/**
 * Description.
 *
 *
 */
Promise.settle = function( promises ) {
    var ret = all( promises, SettledPromiseArray );
    return ret.promise();
};

/**
 * Description.
 *
 *
 */
Promise.all = function( promises ) {
    var ret = all( promises, PromiseArray );
    return ret.promise();
};

/**
 * Description.
 *
 *
 */
Promise.any = function( promises ) {
    var ret = all( promises, AnyPromiseArray );
    return ret.promise();
};

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
Promise.map = function( promises, fn ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function" );
    return Promise.all( promises ).then( function( fulfilleds ) {
        var shouldDefer = false;
        for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
            var fulfill = fulfilleds[i] = fn(fulfilleds[i]);
            if( fulfill instanceof Promise ) {
                shouldDefer = true;
            }
        }

        return shouldDefer ? Promise.all( fulfilleds ) : fulfilleds;
    });
};

/**
 * Description.
 *
 *
 */
Promise.reduce = function( promises, fn, initialValue ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function");

    return Promise.all( promises ).then( function( fulfilleds ) {
        var len = fulfilleds.length;
        var accum;
        var startIndex = 0;
        //Yeah, don't pass undefined explicitly
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
    });
};

/**
 * Create a promise that is already fulfilled with the given
 * value.
 *
 * Note that the promise will be in fulfilled state right away -
 * not on the next event tick.
 *
 * @param {dynamic} value The value the promise is fulfilled with.
 * @return {Promise}
 */
Promise.fulfilled = function( value ) {
    var ret = new Promise();
    ret._fulfill( value );
    return ret;
};

/**
 * Create a promise that is already rejected with the given
 * reason.
 *
 * Note that the promise will be in rejected state right away -
 * not on the next event tick.
 *
 * @param {dynamic} reason The reason the promise is rejected.
 * @return {Promise}
 */
Promise.rejected = function( reason ) {
    var ret = new Promise();
    ret._reject( reason );
    return ret;
};

/**
 * Create a pending promise and a resolver for the promise.
 *
 * @return {PromiseResolver}
 */
Promise.pending = function() {
    return new PromiseResolver( new Promise() );
};

/**
 * If `fn` is a function, will set that function as a callback to call
 * when an possibly unhandled rejection happens. Passing anything other
 * than a function will have the effect of removing any callback
 * and possible errors can be lost forever.
 *
 * If a promise is rejected with a Javascript Error and is not handled
 * in a timely fashion, that promise's rejection is then possibly
 * unhandled. This can happen for example due to buggy code causing
 * a runtime Javascript error.
 *
 * The rejection system implemented must swallow all errors
 * thrown. However, if some promise doesn't have, or will not have,
 * a rejection handler anywhere in its chain, then this implies that
 * the error would be silently lost.
 *
 * By default, all such errors are reported on console but you may
 * use this function to override that behavior with your own handler.
 *
 * Example:
 *
 *     Promise.onPossiblyUnhandledRejection(function( err ) {
 *         throw err;
 *     });
 *
 * The above will throw any unhandled rejection and for example
 * crash a node process.
 *
 * @param {Function|dynamic} fn The callback function. If fn is not
 * a function, no rejections will be reported as possibly unhandled.
 *
 */
Promise.onPossiblyUnhandledRejection = function( fn ) {
    if( typeof fn === "function" ) {
        possiblyUnhandledRejection = fn;
    }
    else {
        possiblyUnhandledRejection = noop;
    }
};

/**
 * Description.
 *
 *
 */
Promise.promisify = function( callback, receiver/*, callbackDescriptor*/ ) {
    return makeNodePromisified( callback, receiver );
};

return Promise;})();


var PromiseArray = (function() {

//Because undefined cannot be smuggled
//we smuggle null instead and convert back to undefined
//when calling
//breaks down if null needs to be smuggled but so far doesn't
function nullToUndefined( val ) {
    return val === null
        ? void 0
        : val;
}

var hasOwn = {}.hasOwnProperty;
var empty = [];

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
                        //when.some resolves to [] when empty
                        //but when.any resolved to void 0 when empty :<
method._init = function( _, fulfillValueIfEmpty ) {
            //_ must be intentionally empty because smuggled
            //data is always the second argument
            //all of this is due to when vs some having different semantics on
            //empty arrays
    var values = this._values;
    if( values instanceof Promise ) {
        //Expect the promise to be a promise
        //for an array
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
            //Fulfilled promise with hopefully
            //an array as a resolution value
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

        //checking for undefined first (1 cycle instruction) in order not to
        //punish reasonable non-sparse arrays
        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }
        if( !(promise instanceof Promise) ) {
            promise = Promise.fulfilled( promise );
        }
        promise._then(
            this._promiseFulfilled,
            this._promiseRejected,
            this._promiseProgressed,

            this,
            i //Smuggle the index as internal data
              //to avoid creating closures in this loop

              //Will not chain so creating a Promise from
              //the ._then() would be a waste anyway

              //(TODO) this caused deoptimizations in gorgikosev's
              //benchmark due to being SMIs
              //investigate if wrapping has too much penatly


        );
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
    //(TODO) could fire a progress when a promise is completed
    this._values[ index ] = value;
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



return PromiseArray;})();
var SettledPromiseArray = (function() {
// the PromiseArray to use with Promise.settle method

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
//override
var throwawayPromise = new Promise();
method._promiseFulfilled = function( value, index ) {
    if( this._isResolved() ) return;
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 0x10000000;
    ret._resolvedValue = value;
    this._promiseResolved( index, ret );

};
//override
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    //Pretty ugly hack
    //but keeps the PromiseInspection constructor
    //simple
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 0x8000000;
    ret._resolvedValue = reason;
    this._promiseResolved( index, ret );

};

return SettledPromiseArray;})();
var AnyPromiseArray = (function() {
// the PromiseArray to use with Promise.any method

function AnyPromiseArray( values ) {
    this.constructor$( values );
}
var method = inherits( AnyPromiseArray, PromiseArray );


method._init = function() {
    //.any must resolve to undefined in case of empty array
    this._init$( void 0, null );
};

//override
method._promiseFulfilled = function( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
//override
method._promiseRejected = function( reason, index ) {
    if( this._isResolved() ) return;
    var totalResolved = ++this._totalResolved;
    this._values[ index ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();
var SomePromiseArray = (function() {
// the PromiseArray to use with Promise.some method

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
    var canPossiblyFulfillCount =
        this._totalResolved - this._rejected + //fulfilled already
        ( this.length() - this._totalResolved ); //could fulfill
    if( this._howMany > canPossiblyFulfillCount ) {
        this._reject( [] );
    }
};

//override
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
//override
method._promiseRejected = function( reason ) {
    if( this._isResolved() ) return;

    this._rejectionValues[ this._rejected ] = reason;
    this._rejected++;
    this._totalResolved++;


    var canPossiblyFulfillCount =
        this._totalResolved - this._rejected + //fulfilled already
        ( this.length() - this._totalResolved ); //could fulfill

    if( this._howMany > canPossiblyFulfillCount ) {
        this._rejectionValues.length = this._rejected;
        this._reject( this._rejectionValues );
        this._resolutionValues =
            this._rejectionValues = null;
    }
};

return SomePromiseArray;})();
var PromiseInspection = (function() {


//Based on
//https://github.com/promises-aplus/synchronous-inspection-spec/issues/6

//Not exactly like that spec because optional properties are like kryptonite
//whereas calls to short functions don't have any penalty and are just
//easier to use than properties (error on mistyping for example).
function PromiseInspection( promise ) {
    this._bitField = promise._bitField;
    this._resolvedValue = promise.isResolved()
        ? promise._resolvedValue
        //Don't keep a reference to something that will never be
        //used
        : void 0;
}
var method = PromiseInspection.prototype;

/**
 * See if the underlying promise was fulfilled at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

/**
 * See if the underlying promise was rejected at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

/**
 * See if the underlying promise was pending at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isPending = function() {
    return ( this._bitField & 0x18000000 ) === 0;
};

/**
 * Get the fulfillment value of the underlying promise. Throws
 * if the promise wasn't fulfilled at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.value = function() {
    if( !this.isFulfilled() ) {
        throw new TypeError(
            "cannot get fulfillment value of a non-fulfilled promise");
    }
    return this._resolvedValue;
};

/**
 * Get the rejection reason for the underlying promise. Throws
 * if the promise wasn't rejected at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.error = function() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};




return PromiseInspection;})();

var PromiseResolver = (function() {

/**
 * Wraps a promise object and can be used to control
 * the fate of that promise. Give .promise to clients
 * and keep the resolver to yourself.
 *
 * Something like a "Deferred".
 *
 * @constructor
 */
function PromiseResolver( promise ) {
    //(TODO) Make this a method and use a custom adapter to pass tests
    this.promise = promise;
}
var method = PromiseResolver.prototype;

/**
 * @return {string}
 */
method.toString = function() {
    return "[object PromiseResolver]";
};

/**
 * Resolve the promise by fulfilling it with the
 * given value.
 *
 * @param {dynamic} value The value to fulfill the promise with.
 *
 */
method.fulfill = function( value ) {
    if( this.promise._tryAssumeStateOf( value ) ) {
        return;
    }
    this.promise._fulfill(value);
};

/**
 * Resolve the promise by rejecting it with the
 * given reason.
 *
 * @param {dynamic} reason The reason why the promise was rejected.
 *
 */
method.reject = function( reason ) {
    this.promise._reject(reason);
};

/**
 * Notify the listeners of the promise of progress.
 *
 * @param {dynamic} value The reason why the promise was rejected.
 *
 */
method.progress = function( value ) {
    this.promise._progress(value);
};

/**
 * Cancel the promise.
 *
 */
method.cancel = function() {
    this.promise.cancel((void 0));
};

/**
 * Resolves the promise by rejecting it with the reason
 * TimeoutError
 */
method.timeout = function() {
    this.promise._reject(new TimeoutError("timeout"));
};

/**
 * See if the promise is resolved.
 *
 * @return {boolean}
 */
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