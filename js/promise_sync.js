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
//R = isResolved
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved
//0 = Always 0 (never used)










var errorObj = {};
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


function subError( constructorName, nameProperty, defaultMessage ) {
    defaultMessage = safeToEmbedString("" + defaultMessage );
    nameProperty = safeToEmbedString("" + nameProperty );

    return new Function("create", "\n" +
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

var TypeError = subError( "TypeError", "Type" );
var CancellationError = subError( "CancellationError", "Cancel" );
var TimeoutError = subError( "TimeoutError", "Timeout" );



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
    hasProp = {}.hasOwnProperty;

function getGetter( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return getterCache[propertyName];
    }
    //The cache is intentionally broken for silly properties
    //that contain newlines or quotes or such
    propertyName = safeToEmbedString(""+propertyName);
    var fn = new Function("obj", "return obj['"+propertyName+"'];");
    getterCache[propertyName] = fn;
    return fn;
}

function getFunction( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return functionCache[propertyName];
    }
    propertyName = (""+propertyName).replace( rescape, replacer );
    var fn = new Function("obj", "return obj['"+propertyName+"']();");
    getterCache[propertyName] = fn;
    return fn;
}
var Async = (function() {
var method = Async.prototype;


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
    var functionBuffer = this._functionBuffer = new Array( 5000 * 3 );
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


method.invoke = function( fn, receiver, arg ) {
    var functionBuffer = this._functionBuffer,
        len = functionBuffer.length,
        length = this._length;

    if( length === len ) {
        //direct index modifications caused out of bounds
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
    if( len > 0 ) {
        for( var i = 0; i < this._length; i += 3 ) {
            functionBuffer[ i + 0 ].call(
                functionBuffer[ i + 1 ],
                functionBuffer[ i + 2 ]
            );
            //Must clear functions immediately otherwise
            //high promotion rate is caused with long
            //sequence chains which leads to mass deoptimization
            //in v8
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

var PromiseInspection = (function() {

//Based on
//https://github.com/promises-aplus/synchronous-inspection-spec/issues/6

//Not exactly like that spec because optional properties are like kryptonite
//whereas calls to short functions don't have any penalty and are just
//easier to use than properties (error on mistyping for example).
function PromiseInspection( promise ) {
    this._isResolved = promise.isResolved();
    this._isFulfilled = promise.isFulfilled();
    this._isRejected = promise.isRejected();

    this._resolvedValue = promise.isResolved()
        ? promise._resolvedValue
        //Don't reference values that will never be
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
    return this._isFulfilled;
};

/**
 * See if the underlying promise was rejected at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isRejected = function() {
    return this._isRejected;
};

/**
 * Get the fulfillment value of the underlying promise. Throws
 * if the promise wasn't fulfilled at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.fulfillmentValue = function() {
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
method.rejectionReason = function() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};




return PromiseInspection;})();

var PromiseResolver = (function() {

/**
 * Deferred
 *
 *
 */
function PromiseResolver( promise ) {
    this.promise = promise;
}
var method = PromiseResolver.prototype;

method.toString = function() {
    return "[object PromiseResolver]";
};

method.fulfill = function( value ) {
    this.promise._fulfill(value);
};

method.reject = function( value ) {
    this.promise._reject(value);
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

/**
 * Description.
 *
 *
 */

//Bitfield Layout
//00RF NCLL LLLL LLLL LLLL LLLL LLLL LLLL
//R = isResolved
//F = isFulfilled
//N = isRejected
//C = isCancellable
//L = Length, 26 bit unsigned
//- = Reserved
//0 = Always 0 (must be never used)
function Promise( resolver ) {
    if( typeof resolver === "function" )
        resolver( new PromiseResolver( this ) );
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
 * Description.
 *
 *
 */
method.toString = function() {
    return "[object Promise]";
};

/**
 * Description.
 *
 *
 */
method.fulfilled = function( fn, receiver ) {
    return this._then( fn, void 0, void 0, receiver );
};

/**
 * Description.
 *
 *
 */
method.rejected = function( fn, receiver ) {
    return this._then( void 0, fn, void 0, receiver );
};

/**
 * Description.
 *
 *
 */
method.progressed = function( fn, receiver ) {
    return this._then( void 0, void 0, fn, receiver );
};

/**
 * Description.
 *
 *
 */
method.resolved = function( fn, receiver ) {
    return this._then( fn, fn, void 0, receiver );
};

/**
 * Description.
 *
 *
 */
method.inspect = function() {
    return new PromiseInspection( this );
};

/**
 * Description.
 *
 *
 */
method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Resolved promises always have ._cancellationParent === null
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    //Recursively the propagated parent or had no parents
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
 * Description.
 *
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
 * Description.
 *
 *
 */
method.get = function( propertyName ) {
    return this.then( getGetter( propertyName ) );
};

/**
 * Description.
 *
 *
 */
method.then = function( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress, this );
};

/**
 * Description.
 *
 *
 */
method.isPending = function() {
    return !this.isResolved();
};

/**
 * Description.
 *
 *
 */
method.isResolved = function() {
    return ( this._bitField & 0x20000000 ) > 0;
};

/**
 * Description.
 *
 *
 */
method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

/**
 * Description.
 *
 *
 */
method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

/**
 * Description.
 *
 *
 */
method.isCancellable = function() {
    return !this.isResolved() &&
        ( this._bitField & 0x4000000 ) > 0;
};

method._then = function( didFulfill, didReject, didProgress, receiver ) {
    var ret = new Promise();
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

method._setResolved = function() {
    this._bitField = this._bitField | 0x20000000;
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
    if( receiver === void 0 ) {
        receiver = this;
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
                promise
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

method._resolveFulfill = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
                obj,
                promise
            );
        }
        else {
            promise._fulfill(obj);
        }
    }
};

method._resolveReject = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._rejectAt( i );
        var promise = this._promiseAt( i );
        if( fn !== noop ) {
            this._resolvePromise(
                fn,
                this._receiverAt( i ),
                obj,
                promise
            );
        }
        else {
            promise._reject(obj);
        }
    }
};

method._cleanValues = function() {
    this._cancellationParent = null;
    this._setResolved();
};

method._fulfill = function( obj ) {
    if( this.isResolved() ) return;
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = obj;
    this._resolveFulfill( obj );

};

method._reject = function( obj ) {
    if( this.isResolved() ) return;
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = obj;
    this._resolveReject( obj );
};

method._progress = function( obj ) {
    if( this.isResolved() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._receiverAt( i ), obj );
            if( ret === errorObj ) {
                this._reject(errorObj.e);
                return;
            }
        }
        promise._progress(ret);
    }
};

/**
 * Description.
 *
 *
 */
Promise.is = function( obj ) {
    return obj instanceof Promise;
};

/**
 * Description.
 *
 *
 */
Promise.when = function( promises ) {
    if( !isArray( promises ) ) {
        promises = [].slice.call( arguments );
    }
    var ret = Promise.pending();
    var len = promises.length;
    var values = new Array( promises.length );
    var total = 0;
    function fulfill( val ) {
        values[ indexOf( promises, this ) ] = val;
        total++;
        if( total === len ) {
            ret.fulfill( values );
        }
    }
    function reject( reason ) {
        ret.reject( reason );
    }
    for( var i = 0; i < len; ++i ) {
        var promise = promises[i];
        promise.fulfilled( fulfill );
        promise.rejected( reject );

    }
    return ret.promise;
};

/**
 * Description.
 *
 *
 */
Promise.fulfilled = function( value ) {
    var ret = new Promise();
    ret._fulfill( value );
    return ret;
};

/**
 * Description.
 *
 *
 */
Promise.rejected = function( value ) {
    var ret = new Promise();
    ret._reject( value );
    return ret;
};

/**
 * Description.
 *
 *
 */
Promise.pending = function() {
    return new PromiseResolver( new Promise() );
};

/**
 * Description.
 *
 *
 */
Promise.promisify = function( callback, receiver/*, callbackDescriptor*/ ) {
    //Default descriptor is node style callbacks

    //Optimize for 0-5 args
    return function() {
        var resolver = Promise.pending();
        var args = [].slice.call(arguments);
        args.push(function( err, value ) {
            if( err ) {
                resolver.reject( err );
            }
            else {
                resolver.fulfill( value );
            }
        });
        callback.apply( receiver, args );
        return resolver.promise;
    };
};

return Promise;})();


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