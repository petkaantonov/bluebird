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

var noop = function(){};

//Ensure in-order async calling of functions
//with minimal use of async functions like setTimeout
var defer = (function() {

    var functionBuffer = new Array( 300 );
    for( var i = 0, len = functionBuffer.length; i < len; ++i ) {
        functionBuffer[i] = void 0;
    }

    var length = 0;
    var wasDeferred = false;

    %constant(FUNCTION_OFFSET, 0);
    %constant(RECEIVER_OFFSET, 1);
    %constant(ARGUMENT_OFFSET, 2);
    %constant(FUNCTION_SIZE, 3);

    function consumeFunctionBuffer() {
        //Don't cache length as new functions can be added
        //whilst calling previous ones
        for( var i = 0; i < length; i += FUNCTION_SIZE ) {
            functionBuffer[ i + FUNCTION_OFFSET ].call(
                functionBuffer[ i + RECEIVER_OFFSET ],
                functionBuffer[ i + ARGUMENT_OFFSET ]
            );
        }
        reset();
    }

    function reset() {
        length = 0;
        wasDeferred = false;
    }

    var deferFn = typeof process !== "undefined" ?
            ( typeof process.setImmediate !== "undefined"
                ? function(){
                    process.setImmediate( consumeFunctionBuffer );
                  }
                : function() {
                    process.nextTick( consumeFunctionBuffer );
                }

            ) :
            ( typeof setTimeout !== "undefined"
                ? function() {
                    setTimeout( consumeFunctionBuffer, 4 );
                }
                : function() {
                    consumeFunctionBuffer();
                }
            ) ;

    return function( fn, receiver, arg ) {
        functionBuffer[ length + FUNCTION_OFFSET ] = fn;
        functionBuffer[ length + RECEIVER_OFFSET ] = receiver;
        functionBuffer[ length + ARGUMENT_OFFSET ] = arg;
        length += FUNCTION_SIZE;
        if( !wasDeferred ) {
            deferFn();
            wasDeferred = true;
        }
    };

})();



var bindDefer = function( fn, ctx ) {
    if( ctx === undefined ) {
        return function( arg ) {
            defer( fn, this, arg );
        };
    }
    else {
        return function( arg ) {
            defer( fn, ctx, arg );
        };
    }
};

var EMPTY = [];
var errorObj = {};
var UNRESOLVED = {};

//Try catch is not supported in optimizing
//compiler, so it is isolated
function tryCatch1( fn, ctx, arg ) {
    try {
        return fn.call( ctx, arg );
    }
    catch( e ) {
        errorObj.e = e;
        return errorObj;
    }
}



function Promise( resolver ) {
    this._isCompleted = false;
    this._isFulfilled = false;
    this._isRejected = false;

    this._callbacks = EMPTY;
    this._completionValue = UNRESOLVED;

    if( typeof resolver === "function" ) {
        var len = resolver.length;
        var fulfill, reject, update;

        if( len > 0 ) fulfill = bindDefer( this._fulfill, this );
        if( len > 1 ) reject = bindDefer( this._reject, this );
        if( len > 2 ) update = bindDefer( this._update, this );

        resolver( fulfill, reject, update );
    }
}
var method = Promise.prototype;

method.cancel = function() {
    if( this.isCompleted() ) return;
    this._reject( new Error("canceled") );
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
    return this._then( didFulfill, didReject, didUpdate, void 0 );
};

method.isPending = function() {
    return !this.isCompleted();
};

method.isCompleted = function() {
    return this._isCompleted;
};

method.isFulfilled = function() {
    return this._isFulfilled;
};

method.isRejected = function() {
    return this._isRejected;
};

method._then = function( didFulfill, didReject, didUpdate, receiver ) {
    var ret = new Promise();

    this._addCallbacks(
        new Callbacks( didFulfill, didReject, didUpdate, ret, receiver )
    );

    if( this.isCompleted() ) {

        defer(
            this._completeLast,
            this,
            //Implicitly gets the correct index from just added callback
            this._getIndexForCurrentLast()
        );
    }

    return ret;
};

method._addCallbacks = function( callbacks ) {
    if( this._callbacks === EMPTY ) {
        this._callbacks = [callbacks];
    }
    else {
        this._callbacks.push( callbacks );
    }
};

method._callFast = function( propertyName ) {
    return this.then( getFunction( propertyName ) );
};

method._callSlow = function( propertyName, args ) {
    return this.then( function( obj ) {
        return obj[propertyName].apply( obj, args );
    });
};

method._getIndexForCurrentLast = function() {
    return this._callbacks.length - 1;
};

method._completeLast = function( index ) {
    if( index < 0 ) {
        return;
    }
    var promiseCallback = this._callbacks[index];
    var promise = promiseCallback.promise;
    var receiver = promiseCallback.receiver;
    var fn;

    if( this.isFulfilled() ) {
        fn = promiseCallback.fulfill;
    }
    else if( this.isRejected() ) {
        fn = promiseCallback.reject;
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

method._completePromise = function( fn, receiver, value, promise2 ) {
    var ret = tryCatch1( fn, receiver, value );
    if( ret === errorObj ) {
        promise2._reject( errorObj.e );
    }
    else if( isPromise( ret ) ) {
        ret.then(
            bindDefer( promise2._fulfill, promise2 ),
            bindDefer( promise2._reject, promise2 ),
            bindDefer( promise2._update, promise2 )
        );
    }
    else {
        promise2._fulfill( ret );
    }
};

method._completeSuccess = function( obj ) {
    this._isCompleted = true;
    this._isFulfilled = true;
    this._completionValue = obj;
    var callbacks = this._callbacks;
    for( var i = 0, len = callbacks.length; i < len; ++i ) {
        var promiseCallback = callbacks[i];
        var fn = promiseCallback.fulfill;
        var promise = promiseCallback.promise;
        if( fn !== noop ) {
            this._completePromise( fn, promiseCallback.receiver, obj, promise );
        }
        else {
            promise._fulfill( obj );
        }
    }

};

method._completeReject = function( obj ) {
    this._isCompleted = true;
    this._isRejected = true;
    this._completionValue = obj;
    var callbacks = this._callbacks;
    for( var i = 0, len = callbacks.length; i < len; ++i ) {
        var promiseCallback = callbacks[i];
        var fn = promiseCallback.reject;
        var promise = promiseCallback.promise;
        if( fn !== noop ) {
            this._completePromise( fn, promiseCallback.receiver, obj, promise );
        }
        else {
            promise._reject( obj );
        }
    }

};


method._fulfill = function( obj ) {
    if( this.isCompleted() ) return;
    this._completeSuccess( obj );
};

method._reject = function( obj ) {
    if( this.isCompleted() ) return;
    this._completeReject( obj );
};

method._update = function( obj ) {
    if( this.isCompleted() ) return;
    var callbacks = this._callbacks;
    for( var i = 0, len = callbacks.length; i < len; ++i ) {
        var promiseCallback = callbacks[i];
        var fn = promiseCallback.update;
        var promise = promiseCallback.promise;
        var ret = obj;
        if( fn !== noop ) {
            ret = tryCatch1( fn, promiseCallback.receiver, obj );
            if( ret === errorObj ) {
                this._reject( errorObj.e );
                return;
            }
        }
        promise._update( ret );
    }
};

function isPromise( value ) {
    if( value == null ) {
        return false;
    }
    return (typeof value === "object" ||
            typeof value === "function") &&
        typeof value.then === "function";
}

Promise.is = isPromise;

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

var PendingPromise = (function() {
    function PendingPromise( promise ) {
        this.promise = promise;
        this.fulfill = bindDefer( this.fulfill, this );
        this.reject = bindDefer( this.reject, this );
        this.update = bindDefer( this.update, this );
    }
    var method = PendingPromise.prototype;

    method.fulfill = function( value ) {
        this.promise._fulfill( value );
    };

    method.reject = function( value ) {
        this.promise._reject( value );
    };

    method.update = function( value ) {
        this.promise._update( value );
    };

    return PendingPromise;
})();

var Callbacks = (function() {
    function Callbacks( fulfill, reject, update, promise, receiver ) {
        this.fulfill = typeof fulfill === "function" ? fulfill : noop;
        this.reject = typeof reject === "function" ? reject : noop;
        this.update = typeof update === "function" ? update : noop;
        this.promise = promise;
        this.receiver = receiver;
    }

    return Callbacks;
})();




if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define( "Promise", [], function(){return Promise;});
}
else {
    global.Promise = Promise;
}


return Promise;})( this, Function, Array, Error );

//Pseudo promise might be syncronous
//Others are failing because of that too