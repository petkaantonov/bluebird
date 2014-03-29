/* jshint -W014, -W116, -W106 */
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
(function( global, Function, Array, Error, Object ) {"use strict";

var ASSERT = (function(){/* jshint -W014, -W116 */
    var AssertionError = (function() {
        function AssertionError( a ) {
            this.constructor$( a );
            this.message = a;
            this.name = "AssertionError";
        }
        AssertionError.prototype = new Error();
        AssertionError.prototype.constructor = AssertionError;
        AssertionError.prototype.constructor$ = Error;
        return AssertionError;
    })();

    return function assert( boolExpr, message ) {
        if( boolExpr === true ) return;

        var ret = new AssertionError( message );
        if( Error.captureStackTrace ) {
            Error.captureStackTrace( ret, assert );
        }
        if( console && console.error ) {
            console.error( ret.stack + "" );
        }
        throw ret;

    };
})();

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
    ASSERT(((typeof fn) === "function"),
    "typeof fn === \u0022function\u0022");
    try {
        return fn.call( receiver, arg );
    }
    catch( e ) {
        errorObj.e = e;
        return errorObj;
    }
}

function tryCatch2( fn, receiver, arg, arg2 ) {
    ASSERT(((typeof fn) === "function"),
    "typeof fn === \u0022function\u0022");
    try {
        return fn.call( receiver, arg, arg2 );
    }
    catch( e ) {
        errorObj.e = e;
        return errorObj;
    }
}

function tryCatchApply( fn, args ) {
    ASSERT(((typeof fn) === "function"),
    "typeof fn === \u0022function\u0022");
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
        "return function promisified( a1, a2, a3, a4, a5 ) {\"use strict\";" +
        "var len = arguments.length;" +
        "var resolver = Promise.pending( promisified );" +
        "" +
        "var fn = function fn( err, value ) {" +
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

if( typeof global.TypeError === "undefined" ) {
    global.TypeError = subError( "TypeError", "TypeError" );
}
var CancellationError = subError( "CancellationError",
    "Cancel", "cancellation error" );
var TimeoutError = subError( "TimeoutError", "Timeout", "timeout error" );


var CapturedTrace = (function() {

var rignore = new RegExp(
    "\\b(?:Promise(?:Array)?\\$_\\w+|tryCatch(?:1|2|Apply)|setTimeout" +
    "|makeNodePromisified|processImmediate|nextTick" +
    "|Async\\$\\w+)\\b"
);

var rtraceline = null;
var formatStack = null;

function CapturedTrace( ignoreUntil ) {
    ASSERT(((typeof ignoreUntil) === "function"),
    "typeof ignoreUntil === \u0022function\u0022");
    ASSERT(((typeof ignoreUntil.name) === "string"),
    "typeof ignoreUntil.name === \u0022string\u0022");
    ASSERT((ignoreUntil.name.length > 0),
    "ignoreUntil.name.length > 0");
    this.captureStackTrace( ignoreUntil );
}
var method = inherits( CapturedTrace, Error );

method.captureStackTrace =
function CapturedTrace$captureStackTrace( ignoreUntil ) {
    captureStackTrace( this, ignoreUntil );
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
    var lines = current.concat( prev );

    var ret = [];


    for( var i = 0, len = lines.length; i < len; ++i ) {
        if( rignore.test( lines[i] ) ||
            ( i > 0 && !rtraceline.test( lines[i] ) )
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
    if( typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function" ) {
        rtraceline = /^\s*at\s*/;
        formatStack = function( stack, error ) {
            return ( typeof stack === "string" )
                ? stack
                : error.name + ". " + error.message;
        };
        return Error.captureStackTrace;
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
            return ( typeof stack === "string" )
                ? ( error.name + ". " + error.message + "\n" + stack )
                : ( error.name + ". " + error.message );
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
            ASSERT(((i + 2) < split.length),
    "i + 2 < split.length");
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

return CapturedTrace;})();

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
    var functionBuffer = this._functionBuffer =
        new Array( 1000 * 3 );
    var self = this;
    this.consumeFunctionBuffer = function Async$consumeFunctionBuffer() {
        self._consumeFunctionBuffer();
    };

    for( var i = 0, len = functionBuffer.length; i < len; ++i ) {
        functionBuffer[i] = void 0;
    }
}
var method = Async.prototype;

method.haveItemsQueued = function Async$haveItemsQueued() {
    return this._length > 0;
};

method.invokeLater = function Async$invokeLater( fn, receiver, arg ) {
    ASSERT(((typeof fn) === "function"),
    "typeof fn === \u0022function\u0022");
    ASSERT((arguments.length === 3),
    "arguments.length === 3");
    this._backupBuffer.push( fn, receiver, arg );
    if( !this._isTickUsed ) {
        deferFn( this.consumeFunctionBuffer );
        this._isTickUsed = true;
    }
};

method.invoke = function Async$invoke( fn, receiver, arg ) {
    ASSERT(((typeof fn) === "function"),
    "typeof fn === \u0022function\u0022");
    ASSERT((arguments.length === 3),
    "arguments.length === 3");
    var functionBuffer = this._functionBuffer,
        len = functionBuffer.length,
        length = this._length;

    if( length === len ) {
        functionBuffer.push( fn, receiver, arg );
    }
    else {
        ASSERT((length < len),
    "length < len");
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

method._consumeFunctionBuffer = function Async$_consumeFunctionBuffer() {
    var functionBuffer = this._functionBuffer;
    ASSERT(this._isTickUsed,
    "this._isTickUsed");
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
        for( var i = 0; i < buffer.length; i+= 3 ) {
            buffer[ i + 0 ].call(
                buffer[ i + 1 ] ,
                buffer[ i + 2 ] );
        }
        buffer.length = 0;
    }
};

method._reset = function Async$_reset() {
    this._isTickUsed = false;
    this._length = 0;
};


return Async;})();

var async = new Async();
var Thenable = (function() {

function Thenable() {
    this.errorObj = errorObj;
    this.__id__ = 0;
    this.treshold = 1000;
    this.thenableCache = new Array( this.treshold );
    this.promiseCache = new Array( this.treshold );
    this._compactQueued = false;
}
var method = Thenable.prototype;

method.couldBe = function Thenable$couldBe( ret ) {
    if( ret === null ||
        typeof ret === "undefined" ||
        typeof ret === "string" ||
        typeof ret === "boolean" ||
        typeof ret === "number" ) {
        return false;
    }
    var id = ret.__id_$thenable__;
    if( typeof id === "number" &&
        this.thenableCache[id] !== void 0 ) {
        return true;
    }
    return ("then" in ret);
};

method.is = function Thenable$is( ret, ref ) {
    var id = ret.__id_$thenable__;
    if( typeof id === "number" &&
        this.thenableCache[id] !== void 0 ) {
        ref.ref = this.thenableCache[id];
        ref.promise = this.promiseCache[id];
        return true;
    }
    return this._thenableSlowCase( ret, ref );
};

method.addCache = function Thenable$_addCache( thenable, promise ) {
    var id = this.__id__;
    this.__id__ = id + 1;
    var descriptor = this._descriptor( id );
    Object.defineProperty( thenable, "__id_$thenable__", descriptor );
    this.thenableCache[id] = thenable;
    this.promiseCache[id] = promise;
    ASSERT((this.thenableCache[thenable.__id_$thenable__] === thenable),
    "this.thenableCache[ thenable.__id_$thenable__ ] === thenable");
    if( this.thenableCache.length > this.treshold &&
        !this._compactQueued) {
        this._compactQueued = true;
        async.invokeLater( this._compactCache, this, void 0 );
    }
};

method.deleteCache = function Thenable$deleteCache( thenable ) {
    var id = thenable.__id_$thenable__;
    ASSERT(((typeof id) === "number"),
    "typeof id === \u0022number\u0022");
    ASSERT(((id | 0) === id),
    "(id | 0) === id");
    if( id === -1 ) {
        return;
    }
    ASSERT((id > -1),
    "id > -1");
    ASSERT((id < this.__id__),
    "id < this.__id__");
    ASSERT((this.thenableCache[id] === thenable),
    "this.thenableCache[id] === thenable");
    this.thenableCache[id] = void 0;
    this.promiseCache[id] = void 0;
    thenable.__id_$thenable__ = -1;};

var descriptor = {
    value: 0,
    enumerable: false,
    writable: true,
    configurable: true
};
method._descriptor = function Thenable$_descriptor( id ) {
    descriptor.value = id;
    return descriptor;
};

method._compactCache = function Thenable$_compactCache() {
    var arr = this.thenableCache;
    var promiseArr = this.promiseCache;
    var skips = 0;
    var j = 0;
    for( var i = 0, len = arr.length; i < len; ++i ) {
        var item = arr[ i ];
        if( item === void 0 ) {
            skips++;
        }
        else {
            promiseArr[ j ] = promiseArr[ i ];
            item.__id_$thenable__ = j;
            arr[ j++ ] = item;
        }
    }
    var newId = arr.length - skips;
    if( newId === this.__id__ ) {
        this.treshold *= 2;
    }
    else for( var i = newId, len = arr.length; i < len; ++i ) {
        promiseArr[ j ] = arr[i] = void 0;
    }

    this.__id__ = newId;
    this._compactQueued = false;
};

method._thenableSlowCase = function Thenable$_thenableSlowCase( ret, ref ) {
    try {
        var then = ret.then;
        if( typeof then === "function" ) {
            ref.ref = then;
            return true;
        }
        return false;
    }
    catch(e) {
        this.errorObj.e = e;
        ref.ref = this.errorObj;
        return true;
    }
};




return Thenable;})();
var CatchFilter = (function() {

function CatchFilter( instances, callback ) {
    this._instances = instances;
    this._callback = callback;
}
var method = CatchFilter.prototype;

method.doFilter = function( e ) {
    if( e === null || typeof e !== "object" ) {
        throw e;
    }
    var cb = this._callback;
    for( var i = 0, len = this._instances.length; i < len; ++i ) {
        var item = this._instances[i];
        if( e instanceof item ) {
            var ret = tryCatch1( cb, void 0, e );
            if( ret === errorObj ) {
                throw ret.e;
            }
            return ret;
        }
    }
    throw e;
};

return CatchFilter;})();
var Promise = (function() {

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
var thenable = new Thenable( errorObj );

function Promise( resolver ) {
    if( typeof resolver === "function" )
        this._resolveResolver( resolver );


    this._bitField = 67108864;
    this._fulfill0 = void 0;
    this._reject0 = void 0;
    this._progress0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    this._resolvedValue = void 0;
    this._cancellationParent = void 0;
    if( longStackTraces ) this._traceParent = this._peekContext();
}

var method = Promise.prototype;

var longStackTraces = true;
Promise.longStackTraces = function() {
    if( async.haveItemsQueued() &&
        longStackTraces === false
    ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

method._setTrace = function _setTrace( fn ) {
    ASSERT((this._trace == null),
    "this._trace == null");
    if( longStackTraces ) {
        this._trace = new CapturedTrace(
            typeof fn === "function"
            ? fn
            : _setTrace
        );
    }
    return this;
};

method.toString = function Promise$toString() {
    return "[object Promise]";
};


method.caught = method["catch"] = function Promise$catch( fn ) {
    var len = arguments.length;
    if( len > 1 ) {
        var catchInstances = new Array( len - 1 ),
            j = 0, i;
        for( i = 0; i < len - 1; ++i ) {
            var item = arguments[i];
            if( typeof item === "function" &&
                ( item.prototype instanceof Error ||
                item === Error ) ) {
                catchInstances[j++] = item;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter( catchInstances, fn );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
};

method.progressed = function Promise$progressed( fn ) {
    return this._then( void 0, void 0, fn, void 0, void 0, this.progressed );
};


function thrower( r ) {
    throw r;
}
function slowFinally( ret, reasonOrValue ) {
    if( this.isFulfilled() ) {
        return ret._then(function() {
            return reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
    else {
        return ret._then(function() {
            throw reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
}
method.lastly = method["finally"] = function Promise$finally( fn ) {
    var r = function( reasonOrValue ) {
        var ret = fn( reasonOrValue );
        if( isPromise( ret ) ) {
            return slowFinally.call( this, ret, reasonOrValue );
        }
        if( this.isRejected() ) throw reasonOrValue;
        return reasonOrValue;
    };
    return this._then( r, r, void 0, this, void 0, this.anyway );
};

method.inspect = function Promise$inspect() {
    return new PromiseInspection( this );
};

method.cancel = function Promise$cancel() {
    if( !this.isCancellable() ) return this;
    var cancelTarget = this;
    while( cancelTarget._cancellationParent !== void 0 ) {
        cancelTarget = cancelTarget._cancellationParent;
    }
    if( cancelTarget === this ) {
        var err = new CancellationError();
        this._attachExtraTrace( err );
        async.invoke( this._reject, this, err );
    }
    else {
        async.invoke( cancelTarget.cancel, cancelTarget, void 0 );
    }
    return this;
};

method.uncancellable = function Promise$uncancellable() {
    var ret = new Promise();
    ret._setTrace();
    ret._unsetCancellable();
    ret._assumeStateOf( this, true );
    return ret;
};

method.fork = function Promise$fork( didFulfill, didReject, didProgress ) {
    var ret = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.fork );
    ret._cancellationParent = void 0;
    return ret;
};

method.call = function Promise$call( propertyName ) {
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

method.get = function Promise$get( propertyName ) {
    return this._then(
        getGetter( propertyName ),
        void 0,
        void 0,
        void 0,
        void 0,
        this.get
    );
};

method.then = function Promise$then( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.then );
};

method.spread = function Promise$spread( didFulfill, didReject ) {
    return this._then( didFulfill, didReject, void 0,
        APPLY, void 0, this.spread );
};
method.isFulfilled = function Promise$isFulfilled() {
    return ( this._bitField & 268435456 ) > 0;
};

method.isRejected = function Promise$isRejected() {
    return ( this._bitField & 134217728 ) > 0;
};

method.isPending = function Promise$isPending() {
    return !this.isResolved();
};

method.isResolved = function Promise$isResolved() {
    return ( this._bitField & 402653184 ) > 0;
};

method.isCancellable = function Promise$isCancellable() {
    return !this.isResolved() &&
        this._cancellable();
};

method.toJSON = function Promise$toJSON() {
    var inspection = this.inspect();
    var ret = {
        isFulfilled: false,
        isRejected: false
    };
    if( inspection.isFulfilled() ) {
        ret.fulfillmentValue = inspection.value();
        ret.isFulfilled = true;
    }
    else if( inspection.isRejected() ) {
        ret.rejectionReason = inspection.error();
        ret.isRejected = true;
    }
    return ret;
};

method.map = function Promise$map( fn ) {
    return Promise.map( this, fn );
};

method.all = function Promise$all() {
    return Promise.all( this );
};

method.any = function Promise$any() {
    return Promise.any( this );
};

method.settle = function Promise$settle() {
    return Promise.settle( this );
};

method.some = function Promise$some( count ) {
    return Promise.some( this, count );
};

method.reduce = function Promise$reduce( fn, initialValue ) {
    return Promise.reduce( this, fn, initialValue );
};

Promise.is = isPromise;

Promise.settle = function Promise$Settle( promises ) {
    var ret = Promise._all( promises, SettledPromiseArray );
    return ret.promise();
};

Promise.all = function Promise$All( promises ) {
    var ret = Promise._all( promises, PromiseArray );
    return ret.promise();
};

Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise._all( ret, PromiseArray ).promise();
};

Promise.any = function Promise$Any( promises ) {
    var ret = Promise._all( promises, AnyPromiseArray );
    return ret.promise();
};

Promise.some = function Promise$Some( promises, howMany ) {
    var ret = Promise._all( promises, SomePromiseArray );
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
Promise.map = function Promise$Map( promises, fn ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function" );
    return Promise.all( promises )._then(
        mapper,
        void 0,
        void 0,
        fn,
        void 0,
        Promise.all
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
    return Promise._all( promises, PromiseArray, slowReduce )
        .promise()
        .then( function( fulfilleds ) {
            return reducer.call( fn, fulfilleds, initialValue );
        });
}


Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
    if( typeof fn !== "function" )
        throw new TypeError( "fn is not a function");
    if( initialValue !== void 0 ) {
        return slowReduce( promises, fn, initialValue );
    }
    return Promise
        .all( promises )
        ._then( reducer, void 0, void 0, fn, void 0, Promise.all );
};

Promise.fulfilled = function Promise$Fulfilled( value ) {
    var ret = new Promise();
    ret._setTrace();
    if( ret._tryAssumeStateOf( value, false ) ) {
        return ret;
    }
    ret._cleanValues();
    ret._setFulfilled();
    ret._resolvedValue = value;
    return ret;
};

Promise.rejected = function Promise$Rejected( reason ) {
    var ret = new Promise();
    ret._setTrace();
    ret._cleanValues();
    ret._setRejected();
    ret._resolvedValue = reason;
    return ret;
};

Promise.pending = function Promise$Pending( caller ) {
    var promise = new Promise();
    promise._setTrace( caller );
    return new PromiseResolver( promise );
};


Promise.cast = function Promise$Cast( obj ) {
    var ret = cast( obj );
    if( !( ret instanceof Promise ) ) {
        return Promise.fulfilled( ret );
    }
    return ret;
};

Promise.onPossiblyUnhandledRejection =
function Promise$OnPossiblyUnhandledRejection( fn ) {
    if( typeof fn === "function" ) {
        CapturedTrace.possiblyUnhandledRejection = fn;
    }
    else {
        CapturedTrace.possiblyUnhandledRejection = void 0;
    }
};

Promise.promisify = function Promise$Promisify( callback, receiver) {
    return makeNodePromisified( callback, receiver );
};

method._then =
function Promise$_then(
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData,
    caller
) {
    var haveInternalData = internalData !== void 0;
    var ret = haveInternalData ? internalData : new Promise();

    if( longStackTraces && !haveInternalData ) {
        ret._traceParent = this;
        ret._setTrace( typeof caller === "function" ? caller : this._then );
    }

    var callbackIndex =
        this._addCallbacks( didFulfill, didReject, didProgress, ret, receiver );

    if( this.isResolved() ) {
        async.invoke( this._resolveLast, this, callbackIndex );
    }
    else if( !haveInternalData && this.isCancellable() ) {
        ret._cancellationParent = this;
    }

    if( this._isDelegated() ) {
        this._unsetDelegated();
        ASSERT((! this.isResolved()),
    "!this.isResolved()");
        var x = this._resolvedValue;
        if( !this._tryThenable( x ) ) {
            async.invoke( this._fulfill, this, x );
        }
    }
    return ret;
};

method._length = function Promise$_length() {
    ASSERT(isPromise(this),
    "isPromise( this )");
    ASSERT((arguments.length === 0),
    "arguments.length === 0");
    return this._bitField & 16777215;
};

method._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return ( this._bitField & 939524096 ) > 0;
};

method._setLength = function Promise$_setLength( len ) {
    this._bitField = ( this._bitField & -16777216 ) |
        ( len & 16777215 ) ;
};

method._cancellable = function Promise$_cancellable() {
    return ( this._bitField & 67108864 ) > 0;
};

method._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | 268435456;
};

method._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | 134217728;
};

method._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | 536870912;
};

method._setDelegated = function Promise$_setDelegated() {
    this._bitField = this._bitField | -1073741824;

};

method._isDelegated = function Promise$_isDelegated() {
    return ( this._bitField & -1073741824 ) === -1073741824;
};

method._unsetDelegated = function Promise$_unsetDelegated() {
    this._bitField = this._bitField & ( ~-1073741824 );
};

method._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | 67108864;
};

method._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & ( ~67108864 );
};

method._receiverAt = function Promise$_receiverAt( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
    ASSERT(((index % 5) === 0),
    "index % CALLBACK_SIZE === 0");
    if( index === 0 ) return this._receiver0;
    return this[ index + 4 - 5 ];
};

method._promiseAt = function Promise$_promiseAt( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
    ASSERT(((index % 5) === 0),
    "index % CALLBACK_SIZE === 0");
    if( index === 0 ) return this._promise0;
    return this[ index + 3 - 5 ];
};

method._fulfillAt = function Promise$_fulfillAt( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
    ASSERT(((index % 5) === 0),
    "index % CALLBACK_SIZE === 0");
    if( index === 0 ) return this._fulfill0;
    return this[ index + 0 - 5 ];
};

method._rejectAt = function Promise$_rejectAt( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
    ASSERT(((index % 5) === 0),
    "index % CALLBACK_SIZE === 0");
    if( index === 0 ) return this._reject0;
    return this[ index + 1 - 5 ];
};

method._progressAt = function Promise$_progressAt( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
    ASSERT(((index % 5) === 0),
    "index % CALLBACK_SIZE === 0");
    if( index === 0 ) return this._progress0;
    return this[ index + 2 - 5 ];
};

var fulfiller = new Function("p",
    "'use strict';return function Promise$_fulfiller(a){ p.fulfill( a ); }" );
var rejecter = new Function("p",
    "'use strict';return function Promise$_rejecter(a){ p.reject( a ); }" );

method._resolveResolver = function Promise$_resolveResolver( resolver ) {
    ASSERT(((typeof resolver) === "function"),
    "typeof resolver === \u0022function\u0022");
    this._setTrace( this._resolveResolver );
    var p = new PromiseResolver( this );
    this._pushContext();
    var r = tryCatch2( resolver, this, fulfiller( p ), rejecter( p ) );
    this._popContext();
    if( r === errorObj ) {
        p.reject( r.e );
    }
};

method._addCallbacks = function Promise$_addCallbacks(
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    fulfill = typeof fulfill === "function" ? fulfill : void 0;
    reject = typeof reject === "function" ? reject : void 0;
    progress = typeof progress === "function" ? progress : void 0;
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

method._callFast = function Promise$_callFast( propertyName ) {
    return this._then(
        getFunction( propertyName ),
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

method._callSlow = function Promise$_callSlow( propertyName, args ) {
    ASSERT(isArray(args),
    "isArray( args )");
    ASSERT((args.length > 0),
    "args.length > 0");
    return this._then( function( obj ) {
        return obj[propertyName].apply( obj, args );
    },
        void 0,
        void 0,
        void 0,
        void 0,
        this.call
    );
};

method._resolveLast = function Promise$_resolveLast( index ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    ASSERT((index >= 0),
    "index >= 0");
    ASSERT((index < this._length()),
    "index < this._length()");
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
    if( fn !== void 0 ) {
        this._resolvePromise( fn, receiver, obj, promise );
    }
    else if( this.isFulfilled() ) {
        promise._fulfill( ret );
    }
    else {
        promise._reject( ret );
    }
};

method._spreadSlowCase =
function Promise$_spreadSlowCase( targetFn, promise, values ) {
    promise._assumeStateOf(
        Promise.all( values )._then( targetFn, void 0, void 0, APPLY, void 0,
            this._spreadSlowCase ),
        false
    );
};


function cast( obj ) {
    if( isObject( obj ) ) {
        if( obj instanceof Promise ) {
            return obj;
        }
        var ref = { ref: null, promise: null };
        if( thenable.is( obj, ref ) ) {
            if( ref.promise != null ) {
                return ref.promise;
            }
            var resolver = Promise.pending();
            var result = ref.ref;
            if( result === errorObj ) {
                resolver.reject( result.e );
                return resolver.promise;
            }
            thenable.addCache( obj, resolver.promise );
            var called = false;
            var ret = tryCatch2( result, obj, function t( a ) {
                if( called ) return;
                called = true;
                async.invoke( thenable.deleteCache, thenable, obj );
                var b = cast( a );
                if( b === a ) {
                    resolver.fulfill( a );
                }
                else {
                    b._then(
                        resolver.fulfill,
                        resolver.reject,
                        void 0,
                        resolver,
                        void 0,
                        t
                    );
                }
            }, function t( a ) {
                if( called ) return;
                called = true;
                async.invoke( thenable.deleteCache, thenable, obj );
                resolver.reject( a );
            });
            if( ret === errorObj && !called ) {
                resolver.reject( ret.e );
                async.invoke( thenable.deleteCache, thenable, obj );
            }
            return resolver.promise;
        }
    }
    return obj;
}

method._resolveThenable = function Promise$_resolveThenable( x, ref ) {
    if( ref.promise != null ) {
        this._assumeStateOf( ref.promise, true );
        return;
    }
    if( ref.ref === errorObj ) {
        this._attachExtraTrace( ref.ref.e );
        async.invoke( this._reject, this, ref.ref.e );
    }
    else {
        thenable.addCache( x, this );
        var then = ref.ref;
        var localX = x;
        var localP = this;
        var key = {};
        var called = false;
        var t = function t( v ) {
            if( called && this !== key ) return;
            called = true;
            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                b._then( t, r, void 0, key, void 0, t);
                return;
            }

            var fn = localP._fulfill;
            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                ASSERT(b.isResolved(),
    "b.isResolved()");
                v = v._resolvedValue;
                b = cast( v );
                ASSERT(((b instanceof Promise) || (b === v)),
    "b instanceof Promise || b === v");
                if( b !== v ||
                    ( b instanceof Promise && b !== v ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }
            async.invoke( fn, localP, v );
            async.invoke( thenable.deleteCache,
                    thenable, localX );
        };

        var r = function r( v ) {
            if( called && this !== key ) return;
            called = true;

            var b = cast( v );

            if( b !== v ||
                ( b instanceof Promise && b.isPending() ) ) {
                b._then( t, r, void 0, key, void 0, t);
                return;
            }

            var fn = localP._reject;
            if( b instanceof Promise ) {
                var fn = b.isFulfilled()
                    ? localP._fulfill : localP._reject;
                ASSERT(b.isResolved(),
    "b.isResolved()");
                v = v._resolvedValue;
                b = cast( v );
                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    b._then( t, r, void 0, key, void 0, t);
                    return;
                }
            }

            async.invoke( fn, localP, v );
            async.invoke( thenable.deleteCache,
                thenable, localX );

        };
        var threw = tryCatch2( then, x, t, r);
        if( threw === errorObj &&
            !called ) {
            this._attachExtraTrace( threw.e );
            async.invoke( this._reject, this, threw.e );
            async.invoke( thenable.deleteCache, thenable, x );
        }
    }
};

method._tryThenable = function Promise$_tryThenable( x ) {
    var ref;
    if( !thenable.is( x, ref = {ref: null, promise: null} ) ) {
        return false;
    }
    this._resolveThenable( x, ref );
    return true;
};

var ignore = CatchFilter.prototype.doFilter;
method._resolvePromise = function Promise$_resolvePromise(
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
            promise._pushContext();
            x = tryCatchApply( onFulfilledOrRejected, value );
        }
        else {
            this._spreadSlowCase( onFulfilledOrRejected, promise, value );
            return;
        }
    }
    else {
        promise._pushContext();
        x = tryCatch1( onFulfilledOrRejected, receiver, value );
    }

    promise._popContext();

    if( x === errorObj ) {
        if( onFulfilledOrRejected !== ignore ) {
            promise._attachExtraTrace( x.e );
        }
        async.invoke( promise._reject, promise, x.e );
    }
    else if( x === promise ) {
        async.invoke(
            promise._reject,
            promise,
            new TypeError( "Circular thenable chain" )
        );
    }
    else {
        if( promise._tryAssumeStateOf( x, true ) ) {
            return;
        }
        else if( thenable.couldBe( x ) ) {

            if( promise._length() === 0 ) {
                promise._resolvedValue = x;
                promise._setDelegated();
                return;
            }
            else if( promise._tryThenable( x ) ) {
                return;
            }
        }
        async.invoke( promise._fulfill, promise, x );
    }
};

method._assumeStateOf =
function Promise$_assumeStateOf( promise, mustAsync ) {
    ASSERT(isPromise(promise),
    "isPromise( promise )");
    ASSERT(((typeof mustAsync) === "boolean"),
    "typeof mustAsync === \u0022boolean\u0022");
    ASSERT((this._isFollowingOrFulfilledOrRejected() === false),
    "this._isFollowingOrFulfilledOrRejected() === false");
    this._setFollowing();
    if( promise.isPending() ) {
        if( promise._cancellable()  ) {
            this._cancellationParent = promise;
        }
        promise._then(
            this._resolveFulfill,
            this._resolveReject,
            this._resolveProgress,
            this,
            void 0,
            this._tryAssumeStateOf
        );
    }
    else if( promise.isFulfilled() ) {
        if( mustAsync )
            async.invoke( this._resolveFulfill, this, promise._resolvedValue );
        else
            this._resolveFulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync )
            async.invoke( this._resolveReject, this, promise._resolvedValue );
        else
            this._resolveReject( promise._resolvedValue );
    }

    if( longStackTraces &&
        promise._traceParent == null ) {
        promise._traceParent = this;
    }
};

method._tryAssumeStateOf =
function Promise$_tryAssumeStateOf( value, mustAsync ) {
    if( !isPromise( value ) ||
        this._isFollowingOrFulfilledOrRejected() ) return false;

    this._assumeStateOf( value, mustAsync );
    return true;
};



method._attachExtraTrace = function Promise$_attachExtraTrace( error ) {
    if( longStackTraces &&
        isError( error ) ) {
        var promise = this;
        var stack = error.stack.split("\n");
        var headerLineCount = 1;

        while( promise != null &&
            promise._trace != null ) {
            stack = CapturedTrace.combine(
                stack,
                promise._trace.stack.split( "\n" )
            );
            promise = promise._traceParent;
        }

        var max = Error.stackTraceLimit + headerLineCount;
        var len = stack.length;
        if( len  > max ) {
            stack.length = max;
        }
        if( stack.length <= headerLineCount ) {
            error.stack = "(No stack trace)";
        }
        else {
            error.stack = stack.join("\n");
        }
    }
};

method._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection( reason ) {
    if( !reason.__handled ) {
        reason.__handled = true;
        CapturedTrace.possiblyUnhandledRejection( reason );
    }
};

method._unhandledRejection = function Promise$_unhandledRejection( reason ) {
    if( !reason.__handled ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

method._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

method._fulfill = function Promise$_fulfill( value ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveFulfill( value );

};

method._reject = function Promise$_reject( reason ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveReject( reason );
};

method._progress = function Promise$_progress( progressValue ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveProgress( progressValue );

};

method._resolveFulfill = function Promise$_resolveFulfill( value ) {
    ASSERT(this.isPending(),
    "this.isPending()");
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    var len = this._length();
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._fulfillAt( i );
        var promise = this._promiseAt( i );
        var receiver = this._receiverAt( i );
        if( fn !== void 0 ) {
            this._resolvePromise(
                fn,
                receiver,
                value,
                promise
            );

        }
        else {
            async.invoke( promise._fulfill, promise, value );
        }
    }
};

method._resolveReject = function Promise$_resolveReject( reason ) {
    ASSERT(this.isPending(),
    "this.isPending()");
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = reason;
    var len = this._length();
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= 5 ) {
        var fn = this._rejectAt( i );
        var promise = this._promiseAt( i );
        if( fn !== void 0 ) {
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
            async.invoke( promise._reject, promise, reason );
        }
    }
    if( !rejectionWasHandled &&
        isError( reason ) &&
        CapturedTrace.possiblyUnhandledRejection !== void 0

    ) {
        if( reason.__handled !== true ) {
            reason.__handled = false;
            async.invoke(
                this._unhandledRejection,
                this,
                reason
            );
        }
    }

};

method._resolveProgress = function Promise$_resolveProgress( progressValue ) {
    ASSERT(this.isPending(),
    "this.isPending()");
    var len = this._length();
    for( var i = 0; i < len; i += 5 ) {
        var fn = this._progressAt( i );
        var promise = this._promiseAt( i );
        if( !isPromise( promise ) ) {
            fn.call( this._receiverAt( i ), progressValue, promise );
            continue;
        }
        var ret = progressValue;
        if( fn !== void 0 ) {
            this._pushContext();
            ret = tryCatch1( fn, this._receiverAt( i ), progressValue );
            this._popContext();
            if( ret === errorObj ) {
                if( ret.e != null &&
                    ret.e.name === "StopProgressPropagation" ) {
                    ret.e.__handled = true;
                }
                else {
                    promise._attachExtraTrace( ret.e );
                    async.invoke( promise._progress, promise, ret.e );
                }
            }
            else if( isPromise( ret ) ) {
                ret._then( promise._progress, null, null, promise, void 0,
                    this._progress );
            }
            else {
                async.invoke( promise._progress, promise, ret );
            }
        }
        else {
            async.invoke( promise._progress, promise, ret );
        }
    }
};

var contextStack = [];
method._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if( lastIndex >= 0 ) {
        return contextStack[ lastIndex ];
    }
    return void 0;

};

method._pushContext = function Promise$_pushContext() {
    if( !longStackTraces ) return;
    contextStack.push( this );
};

method._popContext = function Promise$_popContext() {
    if( !longStackTraces ) return;
    contextStack.pop();
};


Promise._all =
function Promise$_All( promises, PromiseArray, caller ) {
    ASSERT(((typeof PromiseArray) === "function"),
    "typeof PromiseArray === \u0022function\u0022");
    if( isPromise( promises ) ||
        isArray( promises ) ) {

        return new PromiseArray( promises,
            typeof caller === "function"
            ? caller
            : Promise$_All
        );
    }
    throw new TypeError("expecting an array or a promise");
};


if( !CapturedTrace.isSupported() ) {
    Promise.longStackTraces = void 0;
    CapturedTrace.possiblyUnhandledRejection = void 0;
    Promise.onPossiblyUnhandledRejection = void 0;
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

function PromiseArray( values, caller ) {
    this._values = values;
    this._resolver = Promise.pending( caller );
    this._length = 0;
    this._totalResolved = 0;
    this._init( void 0, empty );
}
var method = PromiseArray.prototype;

method.length = function PromiseArray$length() {
    return this._length;
};

method.promise = function PromiseArray$promise() {
    return this._resolver.promise;
};


method._init = function PromiseArray$_init( _, fulfillValueIfEmpty ) {
    var values = this._values;
    if( isPromise( values ) ) {
        if( values.isPending() ) {
            values._then(
                this._init,
                this._reject,
                void 0,
                this,
                fulfillValueIfEmpty,
                this.constructor
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

        promise = Promise.cast( promise );

        promise._then(
            this._promiseFulfilled,
            this._promiseRejected,
            this._promiseProgressed,

            this,            Integer.get( i ),             this.constructor



        );
        newValues[i] = promise;
    }
    this._values = newValues;
    this._length = newLen;
};

method._isResolved = function PromiseArray$_isResolved() {
    return this._values === null;
};

method._fulfill = function PromiseArray$_fulfill( value ) {
    ASSERT((! this._isResolved()),
    "!this._isResolved()");
    this._values = null;
    this._resolver.fulfill( value );
};

method._reject = function PromiseArray$_reject( reason ) {
    ASSERT((! this._isResolved()),
    "!this._isResolved()");
    this._values = null;
    this._resolver.reject( reason );
};

method._promiseProgressed =
function PromiseArray$_promiseProgressed( progressValue, index ) {
    if( this._isResolved() ) return;
    ASSERT(isArray(this._values),
    "isArray( this._values )");

    this._resolver.progress({
        index: index.valueOf(),
        value: progressValue
    });
};

method._promiseFulfilled =
function PromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    ASSERT(isArray(this._values),
    "isArray( this._values )");
    ASSERT((index instanceof Integer),
    "index instanceof Integer");
    this._values[ index.valueOf() ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

method._promiseRejected =
function PromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    ASSERT(isArray(this._values),
    "isArray( this._values )");
    this._totalResolved++;
    this._reject( reason );
};

function Integer( value ) {
    this._value = value;
}

Integer.prototype.valueOf = function Integer$valueOf() {
    return this._value;
};
Integer.get = function Integer$get( i ) {
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
function SettledPromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
var method = inherits( SettledPromiseArray, PromiseArray );



method._promiseResolved =
function SettledPromiseArray$_promiseResolved( index, inspection ) {
    ASSERT(((typeof index) === "number"),
    "typeof index === \u0022number\u0022");
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

var throwawayPromise = new Promise()._setTrace();
method._promiseFulfilled =
function SettledPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 268435456;
    ret._resolvedValue = value;
    this._promiseResolved( index.valueOf(), ret );
};
method._promiseRejected =
function SettledPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection( throwawayPromise );
    ret._bitField = 134217728;
    ret._resolvedValue = reason;
    this._promiseResolved( index.valueOf(), ret );
};

return SettledPromiseArray;})();
var AnyPromiseArray = (function() {
function AnyPromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
var method = inherits( AnyPromiseArray, PromiseArray );

method._init = function AnyPromiseArray$_init() {
    this._init$( void 0, null );
};

method._promiseFulfilled =
function AnyPromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    ++this._totalResolved;
    this._fulfill( value );

};
method._promiseRejected =
function AnyPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    var totalResolved = ++this._totalResolved;
    this._values[ index.valueOf() ] = reason;
    if( totalResolved >= this._length ) {
        this._reject( this._values );
    }

};

return AnyPromiseArray;})();
var SomePromiseArray = (function() {
function SomePromiseArray( values, caller ) {
    this.constructor$( values, caller );
}
var method = inherits( SomePromiseArray, PromiseArray );



method._init = function SomePromiseArray$_init() {
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

method._canPossiblyFulfill =
function SomePromiseArray$_canPossiblyFulfill() {
    return this._totalResolved - this._rejected +
        ( this.length() - this._totalResolved );
};

method._promiseFulfilled =
function SomePromiseArray$_promiseFulfilled( value ) {
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
method._promiseRejected =
function SomePromiseArray$_promiseRejected( reason ) {
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

method.isFulfilled = function PromiseInspection$isFulfilled() {
    return ( this._bitField & 268435456 ) > 0;
};

method.isRejected = function PromiseInspection$isRejected() {
    return ( this._bitField & 134217728 ) > 0;
};

method.isPending = function PromiseInspection$isPending() {
    return ( this._bitField & 402653184 ) === 0;
};

method.value = function PromiseInspection$value() {
    if( !this.isFulfilled() ) {
        throw new TypeError(
            "cannot get fulfillment value of a non-fulfilled promise");
    }
    return this._resolvedValue;
};

method.error = function PromiseInspection$error() {
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

method.toString = function PromiseResolver$toString() {
    return "[object PromiseResolver]";
};

method.fulfill = function PromiseResolver$fulfill( value ) {
    if( this.promise._tryAssumeStateOf( value, false ) ) {
        return;
    }
    async.invoke( this.promise._fulfill, this.promise, value );
};

method.reject = function PromiseResolver$reject( reason ) {
    this.promise._attachExtraTrace( reason );
    async.invoke( this.promise._reject, this.promise, reason );
};

method.progress = function PromiseResolver$progress( value ) {
    async.invoke( this.promise._progress, this.promise, value );
};

method.cancel = function PromiseResolver$cancel() {
    async.invoke( this.promise.cancel, this.promise, void 0 );
};

method.timeout = function PromiseResolver$timeout() {
    this.reject( new TimeoutError( "timeout" ) );
};

method.isResolved = function PromiseResolver$isResolved() {
    return this.promise.isResolved();
};

method.toJSON = function PromiseResolver$toJSON() {
    return this.promise.toJSON();
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
