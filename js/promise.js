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
(function( global, Function, Array, Error ) { "use strict";

//This is the only way to have efficient constants















//Layout
//00CF NY-- --LL LLLL LLLL LLLL LLLL LLLL
//C = isCompleted
//F = isFulfilled
//N = isRejected
//Y = isCancellable
//L = Length, 22 bit unsigned
//- = Reserved
//0 = Always 0 (never used)









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

function tryCatch2( fn, receiver, arg, arg2 ) {
    try {
        console.log(fn,receiver,arg,arg2);
        return fn.call( receiver, arg, arg2 );
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
        if( Promise.errorHandlingMode ===
            Promise.ErrorHandlingMode.PROMISE_ONLY &&
            !( e instanceof PromiseError ) ) {
            throw e;
        }
        errorObj.e = e;
        ref.ref = errorObj;
        return true;
    }
}

function isObject( value ) {
    if( value == null ) {
        return false;
    }
    return ( typeof value === "object" ||
            typeof value === "function" );
}



function isPromise( value ) {
    return isObject(value) &&
        typeof value.then === "function";
}

var create = Object.create || function( proto ) {
    function F(){}
    F.prototype = proto;
    return new F();
};


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

    rescape = /[\r\n\u2028\u2029']/g,

    replacer = function( ch ) {
        return "\\u" + (("0000") +
            (ch.charCodeAt(0).toString(16))).slice(-4);
    },

    hasProp = {}.hasOwnProperty;

function getGetter( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return getterCache[propertyName];
    }
    //The cache is intentionally broken for silly properties
    //that contain newlines or quotes or such
    propertyName = (""+propertyName).replace( rescape, replacer );
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
//Ensure in-order async calling of functions
//with minimal use of async functions like setTimeout

//This whole file is about making a deferred function call
//cost literally* nothing

//*because the buffer is taking the space anyway
var Async = (function() {
var method = Async.prototype;

function Async() {
    this._isTickUsed = false;
    this._length = 0;
    var functionBuffer = this._functionBuffer = new Array( 300 );
    this._deferFn = noop;
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

method.setDeferFunction = function( deferFn ) {
    this._deferFn = deferFn;
};

method.call = function( fn, receiver, arg ) {
    var functionBuffer = this._functionBuffer,
        length = this._length;
    functionBuffer[ length + 0 ] = fn;
    functionBuffer[ length + 1 ] = receiver;
    functionBuffer[ length + 2 ] = arg;
    this._length = length + 3;

    if( !this._isTickUsed ) {
        this._deferFn();
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
        }
        len = this._length;
        for( var i = 0; i < len; ++i ) {
            functionBuffer[i] = void 0;
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

var deferFn = typeof process !== "undefined" ?
    ( typeof global.setImmediate !== "undefined"
        ? function(){
            global.setImmediate( async.consumeFunctionBuffer );
          }
        : function() {
            process.nextTick( async.consumeFunctionBuffer );
        }

    ) :
    ( typeof setTimeout !== "undefined"
        ? function() {
            setTimeout( async.consumeFunctionBuffer, 4 );
        }
        : function() {
            async.consumeFunctionBuffer();
        }
    ) ;


async.setDeferFunction( deferFn );

var bindDefer = function bindDefer( fn, receiver ) {
    return function deferBound( arg ) {
        async.call( fn, receiver, arg );
    };
};

var PendingPromise = (function() {

/**
 * Deferred
 *
 *
 */
function PendingPromise( promise ) {
    this.promise = promise;
}
var method = PendingPromise.prototype;

method.toString = function() {
    return "[object PendingPromise]";
};

method.fulfill = function( value ) {
    async.call( this.promise._fulfill, this.promise, value );
};

method.reject = function( value ) {
    async.call( this.promise._reject, this.promise, value );
};

method.update = function( value ) {
    async.call( this.promise._update, this.promise, value );
};




return PendingPromise;})();
var Promise = (function() {

//Fork, uncancellable
/*
bitfield + length
clean up async
all exception strings should be constant
*/

//CancelException -> CancellationError

function Promise() {
    //See layout in util.js
    this._bitField = 0x4000000;
    //Since most promises only have 0-1 parallel handlers
    //store the first ones directly on the object
    this._fulfill0 =
    this._reject0 =
    this._update0 =
    this._promise0 =
    this._receiver0 =
        void 0;
    //reason for rejection or fulfilled value
    this._completionValue = UNRESOLVED;
    //Used in cancel propagation
    this._cancellationParent = null;
}
var method = Promise.prototype;

method.toString = function() {
    return "[object Promise]";
};

method.fulfilled = function( fn, receiver ) {
    return this._then( fn, void 0, void 0, receiver );
};

method.rejected = function( fn, receiver ) {
    return this._then( void 0, fn, void 0, receiver );
};

method.updated = function( fn, receiver ) {
    return this._then( void 0, void 0, fn, receiver );
};

method.completed = function( fn, receiver ) {
    return this._then( fn, fn, void 0, receiver );
};

method.cancel = function() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    //Propagate to the last parent that is still pending
    //Completed promises always have ._cancellationParent === null
    while( cancelTarget._cancellationParent !== null ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    //Recursively the propagated parent or had no parents
    if( cancelTarget === this ) {
        async.call( this._reject, this, new CancelException() );
    }
    else {
        //Have pending parents, call cancel on the oldest
        async.call( cancelTarget.cancel, cancelTarget, void 0);
    }
    return this;
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

method.then = function( didFulfill, didReject, didUpdate ) {
    return this._then( didFulfill, didReject, didUpdate, this );
};

method.isPending = function() {
    return !this.isCompleted();
};

method.isCompleted = function() {
    return ( this._bitField & 0x20000000 ) > 0;
};

method.isFulfilled = function() {
    return ( this._bitField & 0x10000000 ) > 0;
};

method.isRejected = function() {
    return ( this._bitField & 0x8000000 ) > 0;
};

method.isCancellable = function() {
    return !this.isCompleted() &&
        ( this._bitField & 0x4000000 ) > 0;
};

method._then = function( didFulfill, didReject, didUpdate, receiver ) {
    var ret = new Promise();
    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didUpdate, ret, receiver );

    if( this.isCompleted() ) {
        async.call( this._completeLast, this, callbackIndex );
    }
    else if( this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    return ret;
};

method._length = function() {
    return this._bitField & 0x3FFFFF;
};

method._setLength = function( len ) {
    this._bitField = ( this._bitField & 0x3FC00000 ) | len;
};

method._setCompleted = function() {
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

method._callbackReceiverAt = function( index ) {
    if( index === 0 ) return this._receiver0;
    return this[ index + 4 - 5 ];
};

method._callbackPromiseAt = function( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + 3 - 5 ];
};

method._callbackFulfillAt = function( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + 0 - 5 ];
};

method._callbackRejectAt = function( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + 1 - 5 ];
};

method._callbackUpdateAt = function( index ) {
    if( index === 0 ) return this._update0;
    return this[ index + 2 - 5 ];
};

method._addCallbacks = function( fulfill, reject, update, promise, receiver ) {
    fulfill = typeof fulfill === "function" ? fulfill : noop;
    reject = typeof reject === "function" ? reject : noop;
    update = typeof update === "function" ? update : noop;
    var index = this._length();

    if( index === 0 ) {
        this._fulfill0 = fulfill;
        this._reject0  = reject;
        this._update0 = update;
        this._promise0 = promise;
        this._receiver0 = receiver;
        this._setLength( index + 5 );
        return index;
    }

    this[ index - 5 + 0 ] = fulfill;
    this[ index - 5 + 1 ] = reject;
    this[ index - 5 + 2 ] = update;
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

method._completeLast = function( index ) {
    var promise = this._callbackPromiseAt( index );
    var receiver = this._callbackReceiverAt( index );
    var fn;

    if( this.isFulfilled() ) {
        fn = this._callbackFulfillAt( index );
    }
    else if( this.isRejected() ) {
        fn = this._callbackRejectAt( index );
    }
    else unreachable();

    var obj = this._completionValue;
    var ret = obj;
    if( fn !== noop ) {
        this._completePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._completePromise = function(
    onFulfilledOrRejected, receiver, value, promise
) {
    if( receiver === void 0 ) {
        receiver = this;
    }
    var x = tryCatch1( onFulfilledOrRejected, receiver, value );
    if( x === errorObj ) {
        async.call( promise._reject, promise, errorObj.e );
    }
    else if( x === promise ) {
        async.call(
            promise._reject,
            promise,
            //1. If promise and x refer to the same object,
            //reject promise with a TypeError as the reason.
            new TypeError( "Circular thenable chain" )
        );
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
                promise._update,
                promise
            );
        }
        //3. Otherwise, if x is an object or function,
        else if( isObject( x ) && isThenable( x, ref = {ref: null} ) ) {
            //3.2 If retrieving the property x.then
            //results in a thrown exception e,
            //reject promise with e as the reason.
            if( ref.ref === errorObj ) {
                async.call( promise._reject, promise, errorObj.e );
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
                    async.call( promise._reject, promise, errorObj.e );
                }
            }
        }
        // 3.4 If then is not a function, fulfill promise with x.
        // 4. If x is not an object or function, fulfill promise with x.
        else {
            async.call( promise._fulfill, promise, x );
        }
    }
};

method._completeFulfill = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._callbackFulfillAt( i );
        var promise = this._callbackPromiseAt( i );
        if( fn !== noop ) {
            this._completePromise(
                fn,
                this._callbackReceiverAt( i ),
                obj,
                promise
            );
        }
        else {
            async.call( this._fulfill, promise, obj );
        }
    }
};

method._completeReject = function( obj ) {
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._callbackRejectAt( i );
        var promise = this._callbackPromiseAt( i );
        if( fn !== noop ) {
            this._completePromise(
                fn,
                this._callbackReceiverAt( i ),
                obj,
                promise
            );
        }
        else {
            async.call( this._reject, promise, obj );
        }
    }
};

method._cleanValues = function() {
    this._cancellationParent = null;
    this._setCompleted();
};

method._fulfill = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._setFulfilled();
    this._completionValue = obj;
    this._completeFulfill( obj );

};

method._reject = function( obj ) {
    if( this.isCompleted() ) return;
    this._cleanValues();
    this._setRejected();
    this._completionValue = obj;
    this._completeReject( obj );
};

method._update = function( obj ) {
    if( this.isCompleted() ) return;
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._callbackUpdateAt( i );
        var promise = this._callbackPromiseAt( i );
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, this._callbackReceiverAt( i ), obj );
            if( ret === errorObj ) {
                async.call( this._reject, this, errorObj.e );
                return;
            }
        }
        async.call( this._update, promise, ret );
    }
};

Promise.is = isPromise;

Promise.when = function( promises ) {
    if( !isArray( promises ) ) {
        promises = [].slice.call( arguments );
    }
    var ret = Promise.pending();
    var len = promises.length;
    var values = new Array( promises.length );
    var total = 0;
    function succeed( val ) {
        values[ indexOf( promises, this ) ] = val;
        total++;
        if( total === len ) {
            ret.fulfill( values );
        }
    }
    function fail( reason ) {
        ret.reject( reason );
    }
    for( var i = 0; i < len; ++i ) {
        var promise = promises[i];
        promise.succeeded( succeed );
        promise.failed( fail );

    }
    return ret.promise;
};

Promise.fulfilled = function( value ) {
    var ret = new Promise();
    ret._fulfill( value );
    return ret;
};

Promise.rejected = function( value ) {
    var ret = new Promise();
    ret._reject( value );
    return ret;
};

Promise.pending = function() {
    return new PendingPromise( new Promise() );
};

return Promise;})();


var PromiseError = (function() {

PromiseError.prototype = create(Error.prototype);
PromiseError.prototype.constructor = PromiseError;

function PromiseError() {
    if( typeof Error.captureStackTrace !== "undefined" ) {
        Error.captureStackTrace( this, this.constructor );
    }
    Error.apply( this, arguments );
}

return PromiseError; })();
var CancelException = (function() {

CancelException.prototype = create(PromiseError.prototype);
CancelException.prototype.constructor = CancelException;

function CancelException() {
    PromiseError.apply( this, arguments );
    this.name = "Cancel";
}


return CancelException; })();
Promise.Error = PromiseError;
Promise.CancelException = CancelException;

Promise.ErrorHandlingMode = {
    ANY: {},
    PROMISE_ONLY: {}
};

Promise.errorHandlingMode = Promise.ErrorHandlingMode.ANY;
if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define( "Promise", [], function(){return Promise;});
}
else {
    global.Promise = Promise;
}


return Promise;})( new Function("return this")(), Function, Array, Error );