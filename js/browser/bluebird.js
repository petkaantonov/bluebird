/**
 * bluebird build version 0.9.10-0
 * Features enabled: core, race, any, call_get, filter, generators, map, nodeify, promisify, props, reduce, settle, some, progress, cancel, complex_thenables, synchronous_inspection
 * Features disabled: simple_thenables
*/
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
;(function (f) {
  // CommonJS
  if (typeof exports === "object") {
    module.exports = f();

  // RequireJS
  } else if (typeof define === "function" && define.amd) {
    define(f);

  // <script>
  } else {
    if (typeof window !== "undefined") {
      window.Promise = f();
    } else if (typeof global !== "undefined") {
      global.Promise = f();
    } else if (typeof self !== "undefined") {
      self.Promise = f();
    }
  }

})(function () {var define,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray ) {

    var SomePromiseArray = require( "./some_promise_array.js" )(PromiseArray);

    function Promise$_Any( promises, useBound, caller ) {
        var ret = Promise$_All(
            promises,
            SomePromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        );
        ret.setHowMany( 1 );
        ret.setUnwrap();
        return ret.promise();
    }

    Promise.any = function Promise$Any( promises ) {
        return Promise$_Any( promises, false, Promise.any );
    };

    Promise.prototype.any = function Promise$any() {
        return Promise$_Any( this, true, this.any );
    };

};

},{"./some_promise_array.js":34}],2:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = (function(){
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

},{}],3:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var ASSERT = require("./assert.js");
var schedule = require( "./schedule.js" );
var Queue = require( "./queue.js" );
var errorObj = require( "./util.js").errorObj;
var tryCatch1 = require( "./util.js").tryCatch1;

function Async() {
    this._isTickUsed = false;
    this._length = 0;
    this._lateBuffer = new Queue();
    this._functionBuffer = new Queue( 25000 * 3 );
    var self = this;
    this.consumeFunctionBuffer = function Async$consumeFunctionBuffer() {
        self._consumeFunctionBuffer();
    };
}

Async.prototype.haveItemsQueued = function Async$haveItemsQueued() {
    return this._length > 0;
};

Async.prototype.invokeLater = function Async$invokeLater( fn, receiver, arg ) {
    this._lateBuffer.push( fn, receiver, arg );
    this._queueTick();
};

Async.prototype.invoke = function Async$invoke( fn, receiver, arg ) {
    var functionBuffer = this._functionBuffer;
    functionBuffer.push( fn, receiver, arg );
    this._length = functionBuffer.length();
    this._queueTick();
};

Async.prototype._consumeFunctionBuffer =
function Async$_consumeFunctionBuffer() {
    var functionBuffer = this._functionBuffer;
    while( functionBuffer.length() > 0 ) {
        var fn = functionBuffer.shift();
        var receiver = functionBuffer.shift();
        var arg = functionBuffer.shift();
        fn.call( receiver, arg );
    }
    this._reset();
    this._consumeLateBuffer();
};

Async.prototype._consumeLateBuffer = function Async$_consumeLateBuffer() {
    var buffer = this._lateBuffer;
    while( buffer.length() > 0 ) {
        var fn = buffer.shift();
        var receiver = buffer.shift();
        var arg = buffer.shift();
        var res = tryCatch1( fn, receiver, arg );
        if( res === errorObj ) {
            this._queueTick();
            throw res.e;
        }
    }
};

Async.prototype._queueTick = function Async$_queue() {
    if( !this._isTickUsed ) {
        schedule( this.consumeFunctionBuffer );
        this._isTickUsed = true;
    }
};

Async.prototype._reset = function Async$_reset() {
    this._isTickUsed = false;
    this._length = 0;
};

module.exports = new Async();

},{"./assert.js":2,"./queue.js":26,"./schedule.js":30,"./util.js":36}],4:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var Promise = require("./promise.js")();
module.exports = Promise;
},{"./promise.js":18}],5:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    Promise.prototype.call = function Promise$call( propertyName ) {
        var len = arguments.length;

        var args = new Array(len-1);
        for( var i = 1; i < len; ++i ) {
            args[ i - 1 ] = arguments[ i ];
        }

        return this._then( function( obj ) {
                return obj[ propertyName ].apply( obj, args );
            },
            void 0,
            void 0,
            void 0,
            void 0,
            this.call
        );
    };

    function Promise$getter( obj ) {
        var prop = typeof this === "string"
            ? this
            : ("" + this);
        return obj[ prop ];
    }
    Promise.prototype.get = function Promise$get( propertyName ) {
        return this._then(
            Promise$getter,
            void 0,
            void 0,
            propertyName,
            void 0,
            this.get
        );
    };
};

},{}],6:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    var errors = require( "./errors.js" );
    var async = require( "./async.js" );
    var CancellationError = errors.CancellationError;

    Promise.prototype.cancel = function Promise$cancel() {
        if( !this.isCancellable() ) return this;
        var cancelTarget = this;
        while( cancelTarget._cancellationParent !== void 0 ) {
            cancelTarget = cancelTarget._cancellationParent;
        }
        if( cancelTarget === this ) {
            var err = new CancellationError();
            this._attachExtraTrace( err );
            this._reject( err );
        }
        else {
            async.invoke( cancelTarget.cancel, cancelTarget, void 0 );
        }
        return this;
    };

    Promise.prototype.uncancellable = function Promise$uncancellable() {
        var ret = new Promise();
        ret._setTrace( this.uncancellable, this );
        ret._unsetCancellable();
        ret._assumeStateOf( this, true );
        ret._boundTo = this._boundTo;
        return ret;
    };

    Promise.prototype.fork =
    function Promise$fork( didFulfill, didReject, didProgress ) {
        var ret = this._then( didFulfill, didReject, didProgress,
            void 0, void 0, this.fork );
        ret._cancellationParent = void 0;
        return ret;
    };
};

},{"./async.js":3,"./errors.js":10}],7:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function() {
var ASSERT = require("./assert.js");
var inherits = require( "./util.js").inherits;

var rignore = new RegExp(
    "\\b(?:Promise(?:Array|Spawn)?\\$_\\w+|tryCatch(?:1|2|Apply)|setTimeout" +
    "|CatchFilter\\$_\\w+|makeNodePromisified|processImmediate|nextTick" +
    "|Async\\$\\w+)\\b"
);

var rtraceline = null;
var formatStack = null;
var areNamesMangled = false;

function CapturedTrace( ignoreUntil, isTopLevel ) {
    if( !areNamesMangled ) {
    }
    this.captureStackTrace( ignoreUntil, isTopLevel );

}
inherits( CapturedTrace, Error );

CapturedTrace.prototype.captureStackTrace =
function CapturedTrace$captureStackTrace( ignoreUntil, isTopLevel ) {
    captureStackTrace( this, ignoreUntil, isTopLevel );
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

areNamesMangled = CapturedTrace.prototype.captureStackTrace.name !==
    "CapturedTrace$captureStackTrace";

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

    current.push( "From previous event:" );
    var lines = current.concat( prev );

    var ret = [];


    for( var i = 0, len = lines.length; i < len; ++i ) {

        if( ( rignore.test( lines[i] ) ||
            ( i > 0 && !rtraceline.test( lines[i] ) ) &&
            lines[i] !== "From previous event:" )
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
    function snip( str ) {
        var maxChars = 41;
        if( str.length < maxChars ) {
            return str;
        }
        return str.substr(0, maxChars - 3) + "...";
    }

    function formatNonError( obj ) {
        var str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if( ruselessToString.test( str ) ) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch( e ) {

            }
        }
        return ("(<" + snip( str ) + ">, no stack trace)");
    }

    if( typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function" ) {
        rtraceline = /^\s*at\s*/;
        formatStack = function( stack, error ) {
            if( typeof stack === "string" ) return stack;

            if( error.name !== void 0 &&
                error.message !== void 0 ) {
                return error.name + ". " + error.message;
            }
            return formatNonError( error );


        };
        var captureStackTrace = Error.captureStackTrace;
        return function CapturedTrace$_captureStackTrace(
            receiver, ignoreUntil, isTopLevel ) {
            var prev = -1;
            if( !isTopLevel ) {
                prev = Error.stackTraceLimit;
                Error.stackTraceLimit =
                    Math.max(1, Math.min(10000, prev) / 3 | 0);
            }
            captureStackTrace( receiver, ignoreUntil );

            if( !isTopLevel ) {
                Error.stackTraceLimit = prev;
            }
        };
    }
    var err = new Error();

    if( !areNamesMangled && typeof err.stack === "string" &&
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
            if( typeof stack === "string" ) {
                return ( error.name + ". " + error.message + "\n" + stack );
            }

            if( error.name !== void 0 &&
                error.message !== void 0 ) {
                return error.name + ". " + error.message;
            }
            return formatNonError( error );
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

return CapturedTrace;
};

},{"./assert.js":2,"./util.js":36}],8:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var ensureNotHandled = require( "./errors.js" ).ensureNotHandled;
var util = require( "./util.js");
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function CatchFilter( instances, callback, promise ) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}


function CatchFilter$_safePredicate( predicate, e ) {
    var safeObject = {};
    var retfilter = tryCatch1( predicate, safeObject, e );

    if( retfilter === errorObj ) return retfilter;

    var safeKeys = Object.keys(safeObject);
    if( safeKeys.length ) {
        errorObj.e = new TypeError(
            "Catch filter must inherit from Error "
          + "or be a simple predicate function" );
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function CatchFilter$_doFilter( e ) {
    var cb = this._callback;

    for( var i = 0, len = this._instances.length; i < len; ++i ) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            ( item != null && item.prototype instanceof Error );

        if( itemIsErrorType && e instanceof item ) {
            var ret = tryCatch1( cb, this._promise._boundTo, e );
            if( ret === errorObj ) {
                throw ret.e;
            }
            return ret;
        } else if( typeof item === "function" && !itemIsErrorType ) {
            var shouldHandle = CatchFilter$_safePredicate(item, e);
            if( shouldHandle === errorObj ) {
                this._promise._attachExtraTrace( errorObj.e );
                e = errorObj.e;
                break;
            } else if(shouldHandle) {
                var ret = tryCatch1( cb, this._promise._boundTo, e );
                if( ret === errorObj ) {
                    throw ret.e;
                }
                return ret;
            }
        }
    }
    ensureNotHandled( e );
    throw e;
};

module.exports = CatchFilter;

},{"./errors.js":10,"./util.js":36}],9:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    var ASSERT = require("./assert.js");
    var async = require( "./async.js" );
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;

    function Thenable() {
        this.errorObj = errorObj;
        this.__id__ = 0;
        this.treshold = 1000;
        this.thenableCache = new Array( this.treshold );
        this.promiseCache = new Array( this.treshold );
        this._compactQueued = false;
    }
    Thenable.prototype.couldBe = function Thenable$couldBe( ret ) {
        if( isPrimitive( ret ) ) {
            return false;
        }
        var id = ret.__id_$thenable__;
        if( typeof id === "number" &&
            this.thenableCache[id] !== void 0 ) {
            return true;
        }
        return ("then" in ret);
    };

    Thenable.prototype.is = function Thenable$is( ret, ref ) {
        var id = ret.__id_$thenable__;
        if( typeof id === "number" &&
            this.thenableCache[id] !== void 0 ) {
            ref.ref = this.thenableCache[id];
            ref.promise = this.promiseCache[id];
            return true;
        }
        return this._thenableSlowCase( ret, ref );
    };

    Thenable.prototype.addCache =
    function Thenable$_addCache( thenable, promise ) {
        var id = this.__id__;
        this.__id__ = id + 1;
        var descriptor = this._descriptor( id );
        Object.defineProperty( thenable, "__id_$thenable__", descriptor );
        this.thenableCache[id] = thenable;
        this.promiseCache[id] = promise;
        if( this.thenableCache.length > this.treshold &&
            !this._compactQueued) {
            this._compactQueued = true;
            async.invokeLater( this._compactCache, this, void 0 );
        }
    };

    Thenable.prototype.deleteCache = function Thenable$deleteCache( thenable ) {
        var id = thenable.__id_$thenable__;
        if( id === -1 ) {
            return;
        }
        this.thenableCache[id] = void 0;
        this.promiseCache[id] = void 0;
        thenable.__id_$thenable__ = -1;    };

    var descriptor = {
        value: 0,
        enumerable: false,
        writable: true,
        configurable: true
    };
    Thenable.prototype._descriptor = function Thenable$_descriptor( id ) {
        descriptor.value = id;
        return descriptor;
    };

    Thenable.prototype._compactCache = function Thenable$_compactCache() {
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
            promiseArr[ j ] = arr[ i ] = void 0;
        }

        this.__id__ = newId;
        this._compactQueued = false;
    };

    Thenable.prototype._thenableSlowCase =
    function Thenable$_thenableSlowCase( ret, ref ) {
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

    var thenable = new Thenable( errorObj );

    Promise._couldBeThenable = function( val ) {
        return thenable.couldBe( val );
    };

    function doThenable( obj, ref, caller ) {
        if( ref.promise != null ) {
            return ref.promise;
        }
        var resolver = Promise.pending( caller );
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
            var b = Promise$_Cast( a );
            if( b === a ) {
                resolver.fulfill( a );
            }
            else {
                if( a === obj ) {
                    resolver.promise._resolveFulfill( a );
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

    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }
            var ref = { ref: null, promise: null };
            if( thenable.is( obj, ref ) ) {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return doThenable( obj, ref, caller );
            }
        }
        return obj;
    }

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable( x, ref ) {
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
                var fn = localP._fulfill;
                var b = Promise$_Cast( v );

                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    if( v === x ) {
                        async.invoke( fn, localP, v );
                        async.invoke( thenable.deleteCache, thenable, localX );
                    }
                    else {
                        b._then( t, r, void 0, key, void 0, t);
                    }
                    return;
                }


                if( b instanceof Promise ) {
                    var fn = b.isFulfilled()
                        ? localP._fulfill : localP._reject;
                    v = v._resolvedValue;
                    b = Promise$_Cast( v );
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
                var fn = localP._reject;
                called = true;

                var b = Promise$_Cast( v );

                if( b !== v ||
                    ( b instanceof Promise && b.isPending() ) ) {
                    if( v === x ) {
                        async.invoke( fn, localP, v );
                        async.invoke( thenable.deleteCache, thenable, localX );
                    }
                    else {
                        b._then( t, r, void 0, key, void 0, t);
                    }
                    return;
                }


                if( b instanceof Promise ) {
                    var fn = b.isFulfilled()
                        ? localP._fulfill : localP._reject;
                    v = v._resolvedValue;
                    b = Promise$_Cast( v );
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

    Promise.prototype._tryThenable = function Promise$_tryThenable( x ) {
        var ref;
        if( !thenable.is( x, ref = {ref: null, promise: null} ) ) {
            return false;
        }
        this._resolveThenable( x, ref );
        return true;
    };

    Promise._cast = Promise$_Cast;
};
},{"./assert.js":2,"./async.js":3,"./util.js":36}],10:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var global = require("./global.js");
var Objectfreeze = global.Object.freeze;
var util = require( "./util.js");
var inherits = util.inherits;
var isObject = util.isObject;
var notEnumerableProp = util.notEnumerableProp;
var Error = global.Error;

function isStackAttached( val ) {
    return ( val & 1 ) > 0;
}

function isHandled( val ) {
    return ( val & 2 ) > 0;
}

function withStackAttached( val ) {
    return ( val | 1 );
}

function withHandledMarked( val ) {
    return ( val | 2 );
}

function withHandledUnmarked( val ) {
    return ( val & ( ~2 ) );
}

function ensureNotHandled( reason ) {
    var field;
    if( isObject( reason ) &&
        ( ( field = reason["__promiseHandled__"] ) !== void 0 ) ) {
        reason["__promiseHandled__"] = withHandledUnmarked( field );
    }
}

function attachDefaultState( obj ) {
    try {
        notEnumerableProp( obj, "__promiseHandled__", 0 );
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
        var handledState = obj["__promiseHandled__"];
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

function RejectionError( message ) {
    this.name = "RejectionError";
    this.message = message;
    this.cause = message;

    if( message instanceof Error ) {
        this.message = message.message;
        this.stack = message.stack;
    }
    else if( Error.captureStackTrace ) {
        Error.captureStackTrace( this, this.constructor );
    }

}
inherits( RejectionError, Error );

var key = "__BluebirdErrorTypes__";
var errorTypes = global[key];
if( !errorTypes ) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        RejectionError: RejectionError
    });
    notEnumerableProp( global, key, errorTypes );
}

module.exports = {
    Error: Error,
    TypeError: TypeError,
    CancellationError: errorTypes.CancellationError,
    RejectionError: errorTypes.RejectionError,
    TimeoutError: errorTypes.TimeoutError,
    attachDefaultState: attachDefaultState,
    ensureNotHandled: ensureNotHandled,
    withHandledUnmarked: withHandledUnmarked,
    withHandledMarked: withHandledMarked,
    withStackAttached: withStackAttached,
    isStackAttached: isStackAttached,
    isHandled: isHandled,
    canAttach: canAttach
};

},{"./global.js":14,"./util.js":36}],11:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function(Promise) {
var TypeError = require('./errors.js').TypeError;

function apiRejection( msg ) {
    var error = new TypeError( msg );
    var ret = Promise.rejected( error );
    var parent = ret._peekContext();
    if( parent != null ) {
        parent._attachExtraTrace( error );
    }
    return ret;
}

return apiRejection;
};
},{"./errors.js":10}],12:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var ASSERT = require( "./assert.js" );

    function Promise$_filterer( fulfilleds ) {
        var fn = this;
        var receiver = void 0;
        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        var ret = new Array( fulfilleds.length );
        var j = 0;
        if( receiver === void 0 ) {
             for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                var item = fulfilleds[i];
                if( item === void 0 &&
                    !( i in fulfilleds ) ) {
                    continue;
                }
                if( fn( item, i, len ) ) {
                    ret[j++] = item;
                }
            }
        }
        else {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                var item = fulfilleds[i];
                if( item === void 0 &&
                    !( i in fulfilleds ) ) {
                    continue;
                }
                if( fn.call( receiver, item, i, len ) ) {
                    ret[j++] = item;
                }
            }
        }
        ret.length = j;
        return ret;
    }

    function Promise$_Filter( promises, fn, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === true ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All( promises, PromiseArray, caller,
                useBound === true ? promises._boundTo : void 0 )
            .promise()
            ._then( Promise$_filterer, void 0, void 0, fn, void 0, caller );
    }

    Promise.filter = function Promise$Filter( promises, fn ) {
        return Promise$_Filter( promises, fn, false, Promise.filter );
    };

    Promise.prototype.filter = function Promise$filter( fn ) {
        return Promise$_Filter( this, fn, true, this.filter );
    };
};

},{"./assert.js":2}],13:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, apiRejection ) {
    var PromiseSpawn = require( "./promise_spawn.js" )(Promise);
    var errors = require( "./errors.js");
    var TypeError = errors.TypeError;

    Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
        if( typeof generatorFunction !== "function" ) {
            throw new TypeError( "generatorFunction must be a function" );
        }
        var PromiseSpawn$ = PromiseSpawn;
        return function anonymous() {
            var generator = generatorFunction.apply( this, arguments );
            var spawn = new PromiseSpawn$( void 0, void 0, anonymous );
            spawn._generator = generator;
            spawn._next( void 0 );
            return spawn.promise();
        };
    };

    Promise.spawn = function Promise$Spawn( generatorFunction ) {
        if( typeof generatorFunction !== "function" ) {
            return apiRejection( "generatorFunction must be a function" );
        }
        var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
        var ret = spawn.promise();
        spawn._run( Promise.spawn );
        return ret;
    };
};

},{"./errors.js":10,"./promise_spawn.js":22}],14:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = (function(){
    if( typeof this !== "undefined" ) {
        return this;
    }
    if( typeof process !== "undefined" &&
        typeof global !== "undefined" &&
        typeof process.execPath === "string" ) {
        return global;
    }
    if( typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        typeof navigator !== "undefined" && navigator !== null &&
        typeof navigator.appName === "string" ) {
        return window;
    }
})();

},{}],15:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var ASSERT = require( "./assert.js" );

    function Promise$_mapper( fulfilleds ) {
        var fn = this;
        var receiver = void 0;

        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        var shouldDefer = false;

        if( receiver === void 0 ) {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn( fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
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
        }
        else {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn.call( receiver, fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
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
        }
        return shouldDefer
            ? Promise$_All( fulfilleds, PromiseArray,
                Promise$_mapper, void 0 ).promise()
            : fulfilleds;
    }

    function Promise$_Map( promises, fn, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === true ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All(
            promises,
            PromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        ).promise()
        ._then(
            Promise$_mapper,
            void 0,
            void 0,
            fn,
            void 0,
            caller
        );
    }

    Promise.prototype.map = function Promise$map( fn ) {
        return Promise$_Map( this, fn, true, this.map );
    };

    Promise.map = function Promise$Map( promises, fn ) {
        return Promise$_Map( promises, fn, false, Promise.map );
    };
};

},{"./assert.js":2}],16:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    var util = require( "./util.js" );
    var async = require( "./async.js" );
    var ASSERT = require( "./assert.js" );
    var tryCatch2 = util.tryCatch2;
    var tryCatch1 = util.tryCatch1;
    var errorObj = util.errorObj;

    function thrower( r ) {
        throw r;
    }

    function Promise$_successAdapter( val, receiver ) {
        var nodeback = this;
        var ret = tryCatch2( nodeback, receiver, null, val );
        if( ret === errorObj ) {
            async.invokeLater( thrower, void 0, ret.e );
        }
    }
    function Promise$_errorAdapter( reason, receiver ) {
        var nodeback = this;
        var ret = tryCatch1( nodeback, receiver, reason );
        if( ret === errorObj ) {
            async.invokeLater( thrower, void 0, ret.e );
        }
    }

    Promise.prototype.nodeify = function Promise$nodeify( nodeback ) {
        if( typeof nodeback == "function" ) {
            this._then(
                Promise$_successAdapter,
                Promise$_errorAdapter,
                void 0,
                nodeback,
                this._isBound() ? this._boundTo : null,
                this.nodeify
            );
        }
        return this;
    };
};

},{"./assert.js":2,"./async.js":3,"./util.js":36}],17:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    var ASSERT = require( "./assert.js");
    var util = require( "./util.js" );
    var async = require( "./async.js" );
    var tryCatch1 = util.tryCatch1;
    var errorObj = util.errorObj;

    Promise.prototype.progressed = function Promise$progressed( fn ) {
        return this._then( void 0, void 0, fn,
                            void 0, void 0, this.progressed );
    };

    Promise.prototype._progress = function Promise$_progress( progressValue ) {
        if( this._isFollowingOrFulfilledOrRejected() ) return;
        this._resolveProgress( progressValue );

    };

    Promise.prototype._progressAt = function Promise$_progressAt( index ) {
        if( index === 0 ) return this._progress0;
        return this[ index + 2 - 5 ];
    };

    Promise.prototype._resolveProgress =
    function Promise$_resolveProgress( progressValue ) {
        var len = this._length();
        for( var i = 0; i < len; i += 5 ) {
            var fn = this._progressAt( i );
            var promise = this._promiseAt( i );
            if( !Promise.is( promise ) ) {
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
                        ret.e["__promiseHandled__"] = 2;
                    }
                    else {
                        promise._attachExtraTrace( ret.e );
                        async.invoke( promise._progress, promise, ret.e );
                    }
                }
                else if( Promise.is( ret ) ) {
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
};
},{"./assert.js":2,"./async.js":3,"./util.js":36}],18:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function() {
var global = require("./global.js");
var ASSERT = require("./assert.js");

var util = require( "./util.js" );
var async = require( "./async.js" );
var errors = require( "./errors.js" );
var PromiseArray = require( "./promise_array.js" )(Promise);

var CapturedTrace = require( "./captured_trace.js")();
var CatchFilter = require( "./catch_filter.js");
var PromiseResolver = require( "./promise_resolver.js" );

var isArray = util.isArray;
var notEnumerableProp = util.notEnumerableProp;
var isObject = util.isObject;
var ensurePropertyExpansion = util.ensurePropertyExpansion;
var errorObj = util.errorObj;
var tryCatch1 = util.tryCatch1;
var tryCatch2 = util.tryCatch2;
var tryCatchApply = util.tryCatchApply;

var TypeError = errors.TypeError;
var CancellationError = errors.CancellationError;
var TimeoutError = errors.TimeoutError;
var RejectionError = errors.RejectionError;
var ensureNotHandled = errors.ensureNotHandled;
var withHandledMarked = errors.withHandledMarked;
var withStackAttached = errors.withStackAttached;
var isStackAttached = errors.isStackAttached;
var isHandled = errors.isHandled;
var canAttach = errors.canAttach;
var apiRejection = require("./errors_api_rejection")(Promise);

var APPLY = {};


function isPromise( obj ) {
    if( typeof obj !== "object" ) return false;
    return obj instanceof Promise;
}

function Promise( resolver ) {
    this._bitField = 67108864;
    this._fulfill0 = void 0;
    this._reject0 = void 0;
    this._progress0 = void 0;
    this._promise0 = void 0;
    this._receiver0 = void 0;
    this._resolvedValue = void 0;
    this._cancellationParent = void 0;
    this._boundTo = void 0;
    if( longStackTraces ) this._traceParent = this._peekContext();
    if( typeof resolver === "function" ) this._resolveResolver( resolver );

}

Promise.prototype.bind = function Promise$bind( obj ) {
    var ret = new Promise();
    ret._setTrace( this.bind, this );
    ret._assumeStateOf( this, true );
    ret._setBoundTo( obj );
    return ret;
};

Promise.prototype.toString = function Promise$toString() {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] =
function Promise$_catch( fn ) {
    var len = arguments.length;
    if( len > 1 ) {
        var catchInstances = new Array( len - 1 ),
            j = 0, i;
        for( i = 0; i < len - 1; ++i ) {
            var item = arguments[i];
            if( typeof item === "function" ) {
                catchInstances[j++] = item;
            }
            else {
                var catchFilterTypeError =
                    new TypeError(
                        "A catch filter must be an error constructor "
                        + "or a filter function");

                this._attachExtraTrace( catchFilterTypeError );
                async.invoke( this._reject, this, catchFilterTypeError );
                return;
            }
        }
        catchInstances.length = j;
        fn = arguments[i];

        this._resetTrace();
        var catchFilter = new CatchFilter( catchInstances, fn, this );
        return this._then( void 0, catchFilter.doFilter, void 0,
            catchFilter, void 0, this.caught );
    }
    return this._then( void 0, fn, void 0, void 0, void 0, this.caught );
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
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }, thrower, void 0, this, void 0, slowFinally );
    }
}
Promise.prototype.lastly = Promise.prototype["finally"] =
function Promise$finally( fn ) {
    var r = function( reasonOrValue ) {
        var ret = this._isBound() ? fn.call( this._boundTo ) : fn();
        if( isPromise( ret ) ) {
            return slowFinally.call( this, ret, reasonOrValue );
        }

        if( this.isRejected() ) {
            ensureNotHandled( reasonOrValue );
            throw reasonOrValue;
        }
        return reasonOrValue;
    };
    return this._then( r, r, void 0, this, void 0, this.lastly );
};

Promise.prototype.then =
function Promise$then( didFulfill, didReject, didProgress ) {
    return this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.then );
};

Promise.prototype.done =
function Promise$done( didFulfill, didReject, didProgress ) {
    var promise = this._then( didFulfill, didReject, didProgress,
        void 0, void 0, this.done );
    promise._setIsFinal();
};

Promise.prototype.spread = function Promise$spread( didFulfill, didReject ) {
    return this._then( didFulfill, didReject, void 0,
        APPLY, void 0, this.spread );
};
Promise.prototype.isFulfilled = function Promise$isFulfilled() {
    return ( this._bitField & 268435456 ) > 0;
};

Promise.prototype.isRejected = function Promise$isRejected() {
    return ( this._bitField & 134217728 ) > 0;
};

Promise.prototype.isPending = function Promise$isPending() {
    return !this.isResolved();
};

Promise.prototype.isResolved = function Promise$isResolved() {
    return ( this._bitField & 402653184 ) > 0;
};

Promise.prototype.isCancellable = function Promise$isCancellable() {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function Promise$toJSON() {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: void 0,
        rejectionReason: void 0
    };
    if( this.isFulfilled() ) {
        ret.fulfillmentValue = this._resolvedValue;
        ret.isFulfilled = true;
    }
    else if( this.isRejected() ) {
        ret.rejectionReason = this._resolvedValue;
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function Promise$all() {
    return Promise$_all( this, true, this.all );
};

Promise.is = isPromise;

function Promise$_all( promises, useBound, caller ) {
    return Promise$_All(
        promises,
        PromiseArray,
        caller,
        useBound === true ? promises._boundTo : void 0
    ).promise();
}
Promise.all = function Promise$All( promises ) {
    return Promise$_all( promises, false, Promise.all );
};

Promise.join = function Promise$Join() {
    var ret = new Array( arguments.length );
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = arguments[i];
    }
    return Promise$_All( ret, PromiseArray, Promise.join, void 0 ).promise();
};
Promise.fulfilled = function Promise$Fulfilled( value, caller ) {
    var ret = new Promise();
    ret._setTrace( typeof caller === "function"
        ? caller
        : Promise.fulfilled, void 0 );
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
    ret._setTrace( Promise.rejected, void 0 );
    ret._cleanValues();
    ret._setRejected();
    ret._resolvedValue = reason;
    return ret;
};

Promise["try"] = Promise.attempt = function Promise$_Try( fn, args, ctx ) {

    if( typeof fn !== "function" ) {
        return apiRejection("fn must be a function");
    }
    var value = isArray( args )
        ? tryCatchApply( fn, args, ctx )
        : tryCatch1( fn, ctx, args );

    var ret = new Promise();
    ret._setTrace( Promise.attempt, void 0 );
    if( value === errorObj ) {
        ret._cleanValues();
        ret._setRejected();
        ret._resolvedValue = value.e;
        return ret;
    }

    var maybePromise = Promise._cast(value);
    if( maybePromise instanceof Promise ) {
        ret._assumeStateOf( maybePromise, true );
    }
    else {
        ret._cleanValues();
        ret._setFulfilled();
        ret._resolvedValue = value;
    }

    return ret;
};

Promise.pending = function Promise$Pending( caller ) {
    var promise = new Promise();
    promise._setTrace( typeof caller === "function"
                              ? caller : Promise.pending, void 0 );
    return new PromiseResolver( promise );
};

Promise.bind = function Promise$Bind( obj ) {
    var ret = new Promise();
    ret._setTrace( Promise.bind, void 0 );
    ret._setFulfilled();
    ret._setBoundTo( obj );
    return ret;
};

Promise.cast = function Promise$Cast( obj, caller ) {
    var ret = Promise._cast( obj, caller );
    if( !( ret instanceof Promise ) ) {
        return Promise.fulfilled( ret, caller );
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

var longStackTraces = true || false || !!(
    typeof process !== "undefined" &&
    typeof process.execPath === "string" &&
    typeof process.env === "object" &&
    process.env[ "BLUEBIRD_DEBUG" ]
);


Promise.longStackTraces = function Promise$LongStackTraces() {
    if( async.haveItemsQueued() &&
        longStackTraces === false
    ) {
        throw new Error("Cannot enable long stack traces " +
        "after promises have been created");
    }
    longStackTraces = true;
};

Promise.hasLongStackTraces = function Promise$HasLongStackTraces() {
    return longStackTraces;
};

Promise.prototype._then =
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
        var haveSameContext = this._peekContext() === this._traceParent;
        ret._traceParent = haveSameContext ? this._traceParent : this;
        ret._setTrace( typeof caller === "function" ?
            caller : this._then, this );

    }

    if( !haveInternalData ) {
        ret._boundTo = this._boundTo;
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
        var x = this._resolvedValue;
        if( !this._tryThenable( x ) ) {
            async.invoke( this._fulfill, this, x );
        }
    }
    return ret;
};

Promise.prototype._length = function Promise$_length() {
    return this._bitField & 16777215;
};

Promise.prototype._isFollowingOrFulfilledOrRejected =
function Promise$_isFollowingOrFulfilledOrRejected() {
    return ( this._bitField & 939524096 ) > 0;
};

Promise.prototype._setLength = function Promise$_setLength( len ) {
    this._bitField = ( this._bitField & -16777216 ) |
        ( len & 16777215 ) ;
};

Promise.prototype._cancellable = function Promise$_cancellable() {
    return ( this._bitField & 67108864 ) > 0;
};

Promise.prototype._setFulfilled = function Promise$_setFulfilled() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function Promise$_setRejected() {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function Promise$_setFollowing() {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setDelegated = function Promise$_setDelegated() {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._setIsFinal = function Promise$_setIsFinal() {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function Promise$_isFinal() {
    return ( this._bitField & 33554432 ) > 0;
};

Promise.prototype._isDelegated = function Promise$_isDelegated() {
    return ( this._bitField & -1073741824 ) === -1073741824;
};

Promise.prototype._unsetDelegated = function Promise$_unsetDelegated() {
    this._bitField = this._bitField & ( ~-1073741824 );
};

Promise.prototype._setCancellable = function Promise$_setCancellable() {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function Promise$_unsetCancellable() {
    this._bitField = this._bitField & ( ~67108864 );
};

Promise.prototype._receiverAt = function Promise$_receiverAt( index ) {
    var ret;
    if( index === 0 ) {
        ret = this._receiver0;
    }
    else {
        ret = this[ index + 4 - 5 ];
    }
    if( this._isBound() && ret === void 0 ) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function Promise$_promiseAt( index ) {
    if( index === 0 ) return this._promise0;
    return this[ index + 3 - 5 ];
};

Promise.prototype._fulfillAt = function Promise$_fulfillAt( index ) {
    if( index === 0 ) return this._fulfill0;
    return this[ index + 0 - 5 ];
};

Promise.prototype._rejectAt = function Promise$_rejectAt( index ) {
    if( index === 0 ) return this._reject0;
    return this[ index + 1 - 5 ];
};

Promise.prototype._unsetAt = function Promise$_unsetAt( index ) {
    if( index === 0 ) {
        this._fulfill0 =
        this._reject0 =
        this._progress0 =
        this._promise0 =
        this._receiver0 = void 0;
    }
    else {
        this[ index - 5 + 0 ] =
        this[ index - 5 + 1 ] =
        this[ index - 5 + 2 ] =
        this[ index - 5 + 3 ] =
        this[ index - 5 + 4 ] = void 0;
    }
};

Promise.prototype._resolveResolver =
function Promise$_resolveResolver( resolver ) {
    this._setTrace( this._resolveResolver, void 0 );
    var p = new PromiseResolver( this );
    this._pushContext();
    var r = tryCatch2( resolver, this, function Promise$_fulfiller( val ) {
        p.fulfill( val );
    }, function Promise$_rejecter( val ) {
        p.reject( val );
    });
    this._popContext();
    if( r === errorObj ) {
        p.reject( r.e );
    }
};

Promise.prototype._addCallbacks = function Promise$_addCallbacks(
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

Promise.prototype._spreadSlowCase =
function Promise$_spreadSlowCase( targetFn, promise, values, boundTo ) {
    promise._assumeStateOf(
            Promise$_All( values, PromiseArray, this._spreadSlowCase, boundTo )
            .promise()
            ._then( function() {
                return targetFn.apply( boundTo, arguments );
            }, void 0, void 0, APPLY, void 0,
                    this._spreadSlowCase ),
        false
    );
};

Promise.prototype._setBoundTo = function Promise$_setBoundTo( obj ) {
    this._boundTo = obj;
};

Promise.prototype._isBound = function Promise$_isBound() {
    return this._boundTo !== void 0;
};


var ignore = CatchFilter.prototype.doFilter;
Promise.prototype._resolvePromise = function Promise$_resolvePromise(
    onFulfilledOrRejected, receiver, value, promise
) {
    var isRejected = this.isRejected();

    if( isRejected &&
        typeof value === "object" &&
        value !== null ) {
        var handledState = value["__promiseHandled__"];

        if( handledState === void 0 ) {
            notEnumerableProp( value, "__promiseHandled__", 2 );
        }
        else {
            value["__promiseHandled__"] =
                withHandledMarked( handledState );
        }
    }

    if( !isPromise( promise ) ) {
        return onFulfilledOrRejected.call( receiver, value, promise );
    }

    var x;
    if( !isRejected && receiver === APPLY ) {
        if( isArray( value ) ) {
            for( var i = 0, len = value.length; i < len; ++i ) {
                if( isPromise( value[i] ) ) {
                    this._spreadSlowCase(
                        onFulfilledOrRejected,
                        promise,
                        value,
                        this._boundTo
                    );
                    return;
                }
            }
            promise._pushContext();
            x = tryCatchApply( onFulfilledOrRejected, value, this._boundTo );
        }
        else {
            this._spreadSlowCase( onFulfilledOrRejected, promise,
                    value, this._boundTo );
            return;
        }
    }
    else {
        promise._pushContext();
        x = tryCatch1( onFulfilledOrRejected, receiver, value );
    }

    promise._popContext();

    if( x === errorObj ) {
        ensureNotHandled(x.e);
        if( onFulfilledOrRejected !== ignore ) {
            promise._attachExtraTrace( x.e );
        }
        async.invoke( promise._reject, promise, x.e );
    }
    else if( x === promise ) {
        var selfResolutionError =
            new TypeError( "Circular thenable chain" );
        this._attachExtraTrace( selfResolutionError );
        async.invoke(
            promise._reject,
            promise,
            selfResolutionError
        );
    }
    else {
        if( promise._tryAssumeStateOf( x, true ) ) {
            return;
        }
        else if( Promise._couldBeThenable( x ) ) {

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

Promise.prototype._assumeStateOf =
function Promise$_assumeStateOf( promise, mustAsync ) {
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
            void 0,            this._tryAssumeStateOf
        );
    }
    else if( promise.isFulfilled() ) {
        if( mustAsync === true )
            async.invoke( this._resolveFulfill, this, promise._resolvedValue );
        else
            this._resolveFulfill( promise._resolvedValue );
    }
    else {
        if( mustAsync === true )
            async.invoke( this._resolveReject, this, promise._resolvedValue );
        else
            this._resolveReject( promise._resolvedValue );
    }

    if( longStackTraces &&
        promise._traceParent == null ) {
        promise._traceParent = this;
    }
};

Promise.prototype._tryAssumeStateOf =
function Promise$_tryAssumeStateOf( value, mustAsync ) {
    if( !isPromise( value ) ||
        this._isFollowingOrFulfilledOrRejected() ) return false;

    this._assumeStateOf( value, mustAsync );
    return true;
};

Promise.prototype._resetTrace = function Promise$_resetTrace( caller ) {
    if( longStackTraces ) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        this._trace = new CapturedTrace(
            typeof caller === "function"
            ? caller
            : this._resetTrace,
            isTopLevel
        );
    }
};

Promise.prototype._setTrace = function Promise$_setTrace( caller, parent ) {
    if( longStackTraces ) {
        var context = this._peekContext();
        var isTopLevel = context === void 0;
        if( parent !== void 0 &&
            parent._traceParent === context ) {
            this._trace = parent._trace;
        }
        else {
            this._trace = new CapturedTrace(
                typeof caller === "function"
                ? caller
                : this._setTrace,
                isTopLevel
            );
        }
    }
    return this;
};

Promise.prototype._attachExtraTrace =
function Promise$_attachExtraTrace( error ) {
    if( longStackTraces &&
        canAttach( error ) ) {
        var promise = this;
        var stack = error.stack;
        stack = typeof stack === "string"
            ? stack.split("\n") : [];
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
        error["__promiseHandled__"] =
            withStackAttached( error["__promiseHandled__"] );
    }
};

Promise.prototype._notifyUnhandledRejection =
function Promise$_notifyUnhandledRejection( reason ) {
    if( !isHandled( reason["__promiseHandled__"] ) ) {
        reason["__promiseHandled__"] =
            withHandledMarked( reason["__promiseHandled__"] );
        CapturedTrace.possiblyUnhandledRejection( reason, this );
    }
};

Promise.prototype._unhandledRejection =
function Promise$_unhandledRejection( reason ) {
    if( !isHandled( reason["__promiseHandled__"] ) ) {
        async.invokeLater( this._notifyUnhandledRejection, this, reason );
    }
};

Promise.prototype._cleanValues = function Promise$_cleanValues() {
    this._cancellationParent = void 0;
};

Promise.prototype._fulfill = function Promise$_fulfill( value ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveFulfill( value );

};

Promise.prototype._reject = function Promise$_reject( reason ) {
    if( this._isFollowingOrFulfilledOrRejected() ) return;
    this._resolveReject( reason );
};

Promise.prototype._doResolveAt = function Promise$_doResolveAt( i ) {
    var fn = this.isFulfilled()
        ? this._fulfillAt( i )
        : this._rejectAt( i );
    var value = this._resolvedValue;
    var receiver = this._receiverAt( i );
    var promise = this._promiseAt( i );
    this._unsetAt( i );
    this._resolvePromise( fn, receiver, value, promise );
};

Promise.prototype._resolveFulfill = function Promise$_resolveFulfill( value ) {
    this._cleanValues();
    this._setFulfilled();
    this._resolvedValue = value;
    var len = this._length();
    this._setLength( 0 );
    for( var i = 0; i < len; i+= 5 ) {
        if( this._fulfillAt( i ) !== void 0 ) {
            async.invoke( this._doResolveAt, this, i );
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            async.invoke( promise._fulfill, promise, value );
        }
    }

};

Promise.prototype._resolveLast = function Promise$_resolveLast( index ) {
    this._setLength( 0 );
    var fn;
    if( this.isFulfilled() ) {
        fn = this._fulfillAt( index );
    }
    else {
        fn = this._rejectAt( index );
    }

    if( fn !== void 0 ) {
        async.invoke( this._doResolveAt, this, index );
    }
    else {
        var promise = this._promiseAt( index );
        var value = this._resolvedValue;
        this._unsetAt( index );
        if( this.isFulfilled() ) {
            async.invoke( promise._fulfill, promise, value );
        }
        else {
            async.invoke( promise._reject, promise, value );
        }
    }

};

Promise.prototype._resolveReject = function Promise$_resolveReject( reason ) {
    this._cleanValues();
    this._setRejected();
    this._resolvedValue = reason;
    if( this._isFinal() ) {
        async.invokeLater( thrower, void 0, reason );
        return;
    }
    var len = this._length();
    this._setLength( 0 );
    var rejectionWasHandled = false;
    for( var i = 0; i < len; i+= 5 ) {
        if( this._rejectAt( i ) !== void 0 ) {
            rejectionWasHandled = true;
            async.invoke( this._doResolveAt, this, i );
        }
        else {
            var promise = this._promiseAt( i );
            this._unsetAt( i );
            if( !rejectionWasHandled )
                rejectionWasHandled = promise._length() > 0;
            async.invoke( promise._reject, promise, reason );
        }
    }

    if( !rejectionWasHandled &&
        CapturedTrace.possiblyUnhandledRejection !== void 0
    ) {

        if( isObject( reason ) ) {
            var handledState = reason["__promiseHandled__"];
            var newReason = reason;

            if( handledState === void 0 ) {
                newReason = ensurePropertyExpansion(reason,
                    "__promiseHandled__", 0 );
                handledState = 0;
            }
            else if( isHandled( handledState ) ) {
                return;
            }

            if( !isStackAttached( handledState ) )  {
                this._attachExtraTrace( newReason );
            }
            async.invoke( this._unhandledRejection, this, newReason );

        }
    }

};

var contextStack = [];
Promise.prototype._peekContext = function Promise$_peekContext() {
    var lastIndex = contextStack.length - 1;
    if( lastIndex >= 0 ) {
        return contextStack[ lastIndex ];
    }
    return void 0;

};

Promise.prototype._pushContext = function Promise$_pushContext() {
    if( !longStackTraces ) return;
    contextStack.push( this );
};

Promise.prototype._popContext = function Promise$_popContext() {
    if( !longStackTraces ) return;
    contextStack.pop();
};


function Promise$_All( promises, PromiseArray, caller, boundTo ) {
    if( isPromise( promises ) ||
        isArray( promises ) ) {

        return new PromiseArray(
            promises,
            typeof caller === "function"
                ? caller
                : Promise$_All,
            boundTo
        );
    }
    return new PromiseArray(
        [ apiRejection( "expecting an array or a promise" ) ],
        caller,
        boundTo
    );
}

var old = global.Promise;

Promise.noConflict = function() {
    if( global.Promise === Promise ) {
        global.Promise = old;
    }
    return Promise;
};

if( !CapturedTrace.isSupported() ) {
    Promise.longStackTraces = function(){};
    CapturedTrace.possiblyUnhandledRejection = function(){};
    Promise.onPossiblyUnhandledRejection = function(){};
    longStackTraces = false;
}

Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;
Promise.RejectionError = RejectionError;
require('./synchronous_inspection.js')(Promise);
require('./any.js')(Promise,Promise$_All,PromiseArray);
require('./race.js')(Promise,Promise$_All,PromiseArray);
require('./call_get.js')(Promise);
require('./filter.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./generators.js')(Promise,apiRejection);
require('./map.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./nodeify.js')(Promise);
require('./promisify.js')(Promise);
require('./props.js')(Promise,PromiseArray);
require('./reduce.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./settle.js')(Promise,Promise$_All,PromiseArray);
require('./some.js')(Promise,Promise$_All,PromiseArray,apiRejection);
require('./progress.js')(Promise);
require('./cancel.js')(Promise);
require('./complex_thenables.js')(Promise);

Promise.prototype = Promise.prototype;
return Promise;

};

},{"./any.js":1,"./assert.js":2,"./async.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./complex_thenables.js":9,"./errors.js":10,"./errors_api_rejection":11,"./filter.js":12,"./generators.js":13,"./global.js":14,"./map.js":15,"./nodeify.js":16,"./progress.js":17,"./promise_array.js":19,"./promise_resolver.js":21,"./promisify.js":23,"./props.js":25,"./race.js":27,"./reduce.js":29,"./settle.js":31,"./some.js":33,"./synchronous_inspection.js":35,"./util.js":36}],19:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
var ASSERT = require("./assert.js");
var ensureNotHandled = require( "./errors.js").ensureNotHandled;
var util = require("./util.js");
var async = require( "./async.js");
var hasOwn = {}.hasOwnProperty;
var isArray = util.isArray;

function toFulfillmentValue( val ) {
    switch( val ) {
    case 0: return void 0;
    case 1: return [];
    case 2: return {};
    }
}

function PromiseArray( values, caller, boundTo ) {
    this._values = values;
    this._resolver = Promise.pending( caller );
    if( boundTo !== void 0 ) {
        this._resolver.promise._setBoundTo( boundTo );
    }
    this._length = 0;
    this._totalResolved = 0;
    this._init( void 0, 1 );
}
PromiseArray.PropertiesPromiseArray = function() {};

PromiseArray.prototype.length = function PromiseArray$length() {
    return this._length;
};

PromiseArray.prototype.promise = function PromiseArray$promise() {
    return this._resolver.promise;
};

PromiseArray.prototype._init =
function PromiseArray$_init( _, fulfillValueIfEmpty ) {
    var values = this._values;
    if( Promise.is( values ) ) {
        if( values.isFulfilled() ) {
            values = values._resolvedValue;
            if( !isArray( values ) ) {
                this._fulfill( toFulfillmentValue( fulfillValueIfEmpty ) );
                return;
            }
            this._values = values;
        }
        else if( values.isPending() ) {
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
        else {
            this._reject( values._resolvedValue );
            return;
        }
    }
    if( values.length === 0 ) {
        this._fulfill( toFulfillmentValue( fulfillValueIfEmpty ) );
        return;
    }
    var len = values.length;
    var newLen = len;
    var newValues;
    if( this instanceof PromiseArray.PropertiesPromiseArray ) {
        newValues = this._values;
    }
    else {
        newValues = new Array( len );
    }
    var isDirectScanNeeded = false;
    for( var i = 0; i < len; ++i ) {
        var promise = values[i];
        if( promise === void 0 && !hasOwn.call( values, i ) ) {
            newLen--;
            continue;
        }
        var maybePromise = Promise._cast( promise );
        if( maybePromise instanceof Promise &&
            maybePromise.isPending() ) {
            maybePromise._then(
                this._promiseFulfilled,
                this._promiseRejected,
                this._promiseProgressed,

                this,                i,                 this._scanDirectValues
            );
        }
        else {
            isDirectScanNeeded = true;
        }
        newValues[i] = maybePromise;
    }
    if( newLen === 0 ) {
        if( fulfillValueIfEmpty === 1 ) {
            this._fulfill( newValues );
        }
        else {
            this._fulfill( toFulfillmentValue( fulfillValueIfEmpty ) );
        }
        return;
    }
    this._values = newValues;
    this._length = newLen;
    if( isDirectScanNeeded ) {
        var scanMethod = newLen === len
            ? this._scanDirectValues
            : this._scanDirectValuesHoled;
        async.invoke( scanMethod, this, len );
    }
};

PromiseArray.prototype._resolvePromiseAt =
function PromiseArray$_resolvePromiseAt( i ) {
    var value = this._values[i];
    if( !Promise.is( value ) ) {
        this._promiseFulfilled( value, i );
    }
    else if( value.isFulfilled() ) {
        this._promiseFulfilled( value._resolvedValue, i );
    }
    else if( value.isRejected() ) {
        this._promiseRejected( value._resolvedValue, i );
    }
};

PromiseArray.prototype._scanDirectValuesHoled =
function PromiseArray$_scanDirectValuesHoled( len ) {
    for( var i = 0; i < len; ++i ) {
        if( this._isResolved() ) {
            break;
        }
        if( hasOwn.call( this._values, i ) ) {
            this._resolvePromiseAt( i );
        }
    }
};

PromiseArray.prototype._scanDirectValues =
function PromiseArray$_scanDirectValues( len ) {
    for( var i = 0; i < len; ++i ) {
        if( this._isResolved() ) {
            break;
        }
        this._resolvePromiseAt( i );
    }
};

PromiseArray.prototype._isResolved = function PromiseArray$_isResolved() {
    return this._values === null;
};

PromiseArray.prototype._fulfill = function PromiseArray$_fulfill( value ) {
    this._values = null;
    this._resolver.fulfill( value );
};

PromiseArray.prototype._reject = function PromiseArray$_reject( reason ) {
    ensureNotHandled( reason );
    this._values = null;
    this._resolver.reject( reason );
};

PromiseArray.prototype._promiseProgressed =
function PromiseArray$_promiseProgressed( progressValue, index ) {
    if( this._isResolved() ) return;
    this._resolver.progress({
        index: index,
        value: progressValue
    });
};

PromiseArray.prototype._promiseFulfilled =
function PromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    this._values[ index ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

PromiseArray.prototype._promiseRejected =
function PromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    this._totalResolved++;
    this._reject( reason );
};

return PromiseArray;
};

},{"./assert.js":2,"./async.js":3,"./errors.js":10,"./util.js":36}],20:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var TypeError = require( "./errors.js" ).TypeError;

function PromiseInspection( promise ) {
    if( promise !== void 0 ) {
        this._bitField = promise._bitField;
        this._resolvedValue = promise.isResolved()
            ? promise._resolvedValue
            : void 0;
    }
    else {
        this._bitField = 0;
        this._resolvedValue = void 0;
    }
}
PromiseInspection.prototype.isFulfilled =
function PromiseInspection$isFulfilled() {
    return ( this._bitField & 268435456 ) > 0;
};

PromiseInspection.prototype.isRejected =
function PromiseInspection$isRejected() {
    return ( this._bitField & 134217728 ) > 0;
};

PromiseInspection.prototype.isPending = function PromiseInspection$isPending() {
    return ( this._bitField & 402653184 ) === 0;
};

PromiseInspection.prototype.value = function PromiseInspection$value() {
    if( !this.isFulfilled() ) {
        throw new TypeError(
            "cannot get fulfillment value of a non-fulfilled promise");
    }
    return this._resolvedValue;
};

PromiseInspection.prototype.error = function PromiseInspection$error() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};

module.exports = PromiseInspection;

},{"./errors.js":10}],21:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var util = require( "./util.js" );
var maybeWrapAsError = util.maybeWrapAsError;
var errors = require( "./errors.js");
var TimeoutError = errors.TimeoutError;
var RejectionError = errors.RejectionError;
var async = require( "./async.js" );
var haveGetters = util.haveGetters;

function isUntypedError( obj ) {
    return obj instanceof Error &&
        Object.getPrototypeOf( obj ) === Error.prototype;
}

function wrapAsRejectionError( obj ) {
    if( isUntypedError( obj ) ) {
        return new RejectionError( obj );
    }
    return obj;
}

function nodebackForResolver( resolver ) {
    function PromiseResolver$_callback( err, value ) {
        if( err ) {
            resolver.reject( wrapAsRejectionError( maybeWrapAsError( err ) ) );
        }
        else {
            if( arguments.length > 2 ) {
                var len = arguments.length;
                var val = new Array( len - 1 );
                for( var i = 1; i < len; ++i ) {
                    val[ i - 1 ] = arguments[ i ];
                }

                value = val;
            }
            resolver.fulfill( value );
        }
    }
    return PromiseResolver$_callback;
}


var PromiseResolver;
if( !haveGetters ) {
    PromiseResolver = function PromiseResolver( promise ) {
        this.promise = promise;
        this.asCallback = nodebackForResolver( this );
    };
}
else {
    PromiseResolver = function PromiseResolver( promise ) {
        this.promise = promise;
    };
}
if( haveGetters ) {
    Object.defineProperty( PromiseResolver.prototype, "asCallback", {
        get: function() {
            return nodebackForResolver( this );
        }
    });
}

PromiseResolver._nodebackForResolver = nodebackForResolver;

PromiseResolver.prototype.toString = function PromiseResolver$toString() {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.fulfill = function PromiseResolver$fulfill( value ) {
    if( this.promise._tryAssumeStateOf( value, false ) ) {
        return;
    }
    async.invoke( this.promise._fulfill, this.promise, value );
};

PromiseResolver.prototype.reject = function PromiseResolver$reject( reason ) {
    this.promise._attachExtraTrace( reason );
    async.invoke( this.promise._reject, this.promise, reason );
};

PromiseResolver.prototype.progress =
function PromiseResolver$progress( value ) {
    async.invoke( this.promise._progress, this.promise, value );
};

PromiseResolver.prototype.cancel = function PromiseResolver$cancel() {
    async.invoke( this.promise.cancel, this.promise, void 0 );
};

PromiseResolver.prototype.timeout = function PromiseResolver$timeout() {
    this.reject( new TimeoutError( "timeout" ) );
};

PromiseResolver.prototype.isResolved = function PromiseResolver$isResolved() {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function PromiseResolver$toJSON() {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./async.js":3,"./errors.js":10,"./util.js":36}],22:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
var errors = require( "./errors.js" );
var TypeError = errors.TypeError;
var ensureNotHandled = errors.ensureNotHandled;
var util = require("./util.js");
var errorObj = util.errorObj;
var tryCatch1 = util.tryCatch1;

function PromiseSpawn( generatorFunction, receiver, caller ) {
    this._resolver = Promise.pending( caller );
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = void 0;
}

PromiseSpawn.prototype.promise = function PromiseSpawn$promise() {
    return this._resolver.promise;
};

PromiseSpawn.prototype._run = function PromiseSpawn$_run() {
    this._generator = this._generatorFunction.call( this._receiver );
    this._receiver =
        this._generatorFunction = void 0;
    this._next( void 0 );
};

PromiseSpawn.prototype._continue = function PromiseSpawn$_continue( result ) {
    if( result === errorObj ) {
        this._generator = void 0;
        this._resolver.reject( result.e );
        return;
    }

    var value = result.value;
    if( result.done === true ) {
        this._generator = void 0;
        this._resolver.fulfill( value );
    }
    else {
        var maybePromise = Promise._cast( value, PromiseSpawn$_continue );
        if( !( maybePromise instanceof Promise ) ) {
            this._throw( new TypeError(
                "A value was yielded that could not be treated as a promise"
            ) );
            return;
        }
        maybePromise._then(
            this._next,
            this._throw,
            void 0,
            this,
            null,
            void 0
        );
    }
};

PromiseSpawn.prototype._throw = function PromiseSpawn$_throw( reason ) {
    ensureNotHandled( reason );
    this.promise()._attachExtraTrace( reason );
    this._continue(
        tryCatch1( this._generator["throw"], this._generator, reason )
    );
};

PromiseSpawn.prototype._next = function PromiseSpawn$_next( value ) {
    this._continue(
        tryCatch1( this._generator.next, this._generator, value )
    );
};

return PromiseSpawn;
};
},{"./errors.js":10,"./util.js":36}],23:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
var THIS = {};
var util = require( "./util.js");
var errors = require( "./errors.js" );
var nodebackForResolver = require( "./promise_resolver.js" )
    ._nodebackForResolver;
var RejectionError = errors.RejectionError;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var notEnumerableProp = util.notEnumerableProp;
var deprecated = util.deprecated;
var ASSERT = require( "./assert.js" );

Promise.prototype.error = function( fn ) {
    return this.caught( RejectionError, fn );
};

function makeNodePromisifiedEval( callback, receiver, originalName ) {
    function getCall(count) {
        var args = new Array(count);
        for( var i = 0, len = args.length; i < len; ++i ) {
            args[i] = "a" + (i+1);
        }
        var comma = count > 0 ? "," : "";

        if( typeof callback === "string" &&
            receiver === THIS ) {
            return "this['" + callback + "']("+args.join(",") +
                comma +" fn);"+
                "break;";
        }
        return ( receiver === void 0
            ? "callback("+args.join(",")+ comma +" fn);"
            : "callback.call("+( receiver === THIS
                ? "this"
                : "receiver" )+", "+args.join(",") + comma + " fn);" ) +
        "break;";
    }

    function getArgs() {
        return "var args = new Array( len + 1 );" +
        "var i = 0;" +
        "for( var i = 0; i < len; ++i ) { " +
        "   args[i] = arguments[i];" +
        "}" +
        "args[i] = fn;";
    }

    var callbackName = ( typeof originalName === "string" ?
        originalName + "Async" :
        "promisified" );

    return new Function("Promise", "callback", "receiver",
            "withAppended", "maybeWrapAsError", "nodebackForResolver",
        "var ret = function " + callbackName +
        "( a1, a2, a3, a4, a5 ) {\"use strict\";" +
        "var len = arguments.length;" +
        "var resolver = Promise.pending( " + callbackName + " );" +
        "var fn = nodebackForResolver( resolver );"+
        "try{" +
        "switch( len ) {" +
        "case 1:" + getCall(1) +
        "case 2:" + getCall(2) +
        "case 3:" + getCall(3) +
        "case 0:" + getCall(0) +
        "case 4:" + getCall(4) +
        "case 5:" + getCall(5) +
        "default: " + getArgs() + (typeof callback === "string"
            ? "this['" + callback + "'].apply("
            : "callback.apply("
        ) +
            ( receiver === THIS ? "this" : "receiver" ) +
        ", args ); break;" +
        "}" +
        "}" +
        "catch(e){ " +
        "" +
        "resolver.reject( maybeWrapAsError( e ) );" +
        "}" +
        "return resolver.promise;" +
        "" +
        "}; ret.__isPromisified__ = true; return ret;"
    )(Promise, callback, receiver, withAppended,
        maybeWrapAsError, nodebackForResolver);
}

function makeNodePromisifiedClosure( callback, receiver ) {
    function promisified() {
        var _receiver = receiver;
        if( receiver === THIS ) _receiver = this;
        if( typeof callback === "string" ) {
            callback = _receiver[callback];
        }
        var resolver = Promise.pending( promisified );
        var fn = nodebackForResolver( resolver );
        try {
            callback.apply( _receiver, withAppended( arguments, fn ) );
        }
        catch(e) {
            resolver.reject( maybeWrapAsError( e ) );
        }
        return resolver.promise;
    }
    promisified.__isPromisified__ = true;
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function f(){}
function isPromisified( fn ) {
    return fn.__isPromisified__ === true;
}
var hasProp = {}.hasOwnProperty;
var roriginal = new RegExp( "__beforePromisified__" + "$" );
function _promisify( callback, receiver, isAll ) {
    if( isAll ) {
        var changed = 0;
        var o = {};
        for( var key in callback ) {
            if( !roriginal.test( key ) &&
                !hasProp.call( callback,
                    ( key + "__beforePromisified__" ) ) &&
                typeof callback[ key ] === "function" ) {
                var fn = callback[key];
                if( !isPromisified( fn ) ) {
                    changed++;
                    var originalKey = key + "__beforePromisified__";
                    var promisifiedKey = key + "Async";
                    notEnumerableProp( callback, originalKey, fn );
                    o[ promisifiedKey ] =
                        makeNodePromisified( originalKey, THIS, key );
                }
            }
        }
        if( changed > 0 ) {
            for( var key in o ) {
                if( hasProp.call( o, key ) ) {
                    callback[key] = o[key];
                }
            }
            f.prototype = callback;
        }

        return callback;
    }
    else {
        return makeNodePromisified( callback, receiver, void 0 );
    }
}

Promise.promisify = function Promise$Promisify( callback, receiver ) {
    if( typeof callback === "object" && callback !== null ) {
        deprecated( "Promise.promisify for promisifying entire objects " +
            "is deprecated. Use Promise.promisifyAll instead." );
        return _promisify( callback, receiver, true );
    }
    if( typeof callback !== "function" ) {
        throw new TypeError( "callback must be a function" );
    }
    if( isPromisified( callback ) ) {
        return callback;
    }
    return _promisify(
        callback,
        arguments.length < 2 ? THIS : receiver,
        false );
};

Promise.promisifyAll = function Promise$PromisifyAll( target ) {
    if( typeof target !== "function" && typeof target !== "object" ) {
        throw new TypeError( "Cannot promisify " + typeof target );
    }
    return _promisify( target, void 0, true );
};
};


},{"./assert.js":2,"./errors.js":10,"./promise_resolver.js":21,"./util.js":36}],24:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function(Promise, PromiseArray) {
var ASSERT = require("./assert.js");
var util = require("./util.js");
var inherits = util.inherits;

function PropertiesPromiseArray( obj, caller, boundTo ) {
    var keys = Object.keys( obj );
    var values = new Array( keys.length );
    for( var i = 0, len = values.length; i < len; ++i ) {
        values[i] = obj[keys[i]];
    }
    this.constructor$( values, caller, boundTo );
    if( !this._isResolved() ) {
        for( var i = 0, len = keys.length; i < len; ++i ) {
            values.push( keys[i] );
        }
    }
}
inherits( PropertiesPromiseArray, PromiseArray );

PropertiesPromiseArray.prototype._init =
function PropertiesPromiseArray$_init() {
    this._init$( void 0, 2 ) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled =
function PropertiesPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    this._values[ index ] = value;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        var val = {};
        var keyOffset = this.length();
        for( var i = 0, len = this.length(); i < len; ++i ) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._fulfill( val );
    }
};

PropertiesPromiseArray.prototype._promiseProgressed =
function PropertiesPromiseArray$_promiseProgressed( value, index ) {
    if( this._isResolved() ) return;

    this._resolver.progress({
        key: this._values[ index + this.length() ],
        value: value
    });
};

PromiseArray.PropertiesPromiseArray = PropertiesPromiseArray;

return PropertiesPromiseArray;
};
},{"./assert.js":2,"./util.js":36}],25:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, PromiseArray ) {
    var PropertiesPromiseArray = require("./properties_promise_array.js")(
        Promise, PromiseArray);
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;

    function Promise$_Props( promises, useBound, caller ) {
        var ret;
        if( isPrimitive( promises ) ) {
            ret = Promise.fulfilled( promises, caller );
        }
        else if( Promise.is( promises ) ) {
            ret = promises._then( Promise.props, void 0, void 0,
                            void 0, void 0, caller );
        }
        else {
            ret = new PropertiesPromiseArray(
                promises,
                caller,
                useBound === true ? promises._boundTo : void 0
            ).promise();
            useBound = false;
        }
        if( useBound === true ) {
            ret._boundTo = promises._boundTo;
        }
        return ret;
    }

    Promise.prototype.props = function Promise$props() {
        return Promise$_Props( this, true, this.props );
    };

    Promise.props = function Promise$Props( promises ) {
        return Promise$_Props( promises, false, Promise.props );
    };
};
},{"./properties_promise_array.js":24,"./util.js":36}],26:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var ASSERT = require("./assert.js");
function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
    for( var j = 0; j < len; ++j ) {
        dst[ j + dstIndex ] = src[ j + srcIndex ];
    }
}

function pow2AtLeast( n ) {
    n = n >>> 0;
    n = n - 1;
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n + 1;
}

function getCapacity( capacity ) {
    if( typeof capacity !== "number" ) return 16;
    return pow2AtLeast(
        Math.min(
            Math.max( 16, capacity ), 1073741824 )
    );
}

function Queue( capacity ) {
    this._capacity = getCapacity( capacity );
    this._length = 0;
    this._front = 0;
    this._makeCapacity();
}

Queue.prototype._willBeOverCapacity =
function Queue$_willBeOverCapacity( size ) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function Queue$_pushOne( arg ) {
    var length = this.length();
    this._checkCapacity( length + 1 );
    var i = ( this._front + length ) & ( this._capacity - 1 );
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype.push = function Queue$push( fn, receiver, arg ) {
    var length = this.length() + 3;
    if( this._willBeOverCapacity( length ) ) {
        this._pushOne( fn );
        this._pushOne( receiver );
        this._pushOne( arg );
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity( length );
    var wrapMask = this._capacity - 1;
    this[ ( j + 0 ) & wrapMask ] = fn;
    this[ ( j + 1 ) & wrapMask ] = receiver;
    this[ ( j + 2 ) & wrapMask ] = arg;
    this._length = length;
};

Queue.prototype.shift = function Queue$shift() {
    var front = this._front,
        ret = this[ front ];

    this[ front ] = void 0;
    this._front = ( front + 1 ) & ( this._capacity - 1 );
    this._length--;
    return ret;
};

Queue.prototype.length = function Queue$length() {
    return this._length;
};

Queue.prototype._makeCapacity = function Queue$_makeCapacity() {
    var len = this._capacity;
    for( var i = 0; i < len; ++i ) {
        this[i] = void 0;
    }
};

Queue.prototype._checkCapacity = function Queue$_checkCapacity( size ) {
    if( this._capacity < size ) {
        this._resizeTo( this._capacity << 3 );
    }
};

Queue.prototype._resizeTo = function Queue$_resizeTo( capacity ) {
    var oldFront = this._front;
    var oldCapacity = this._capacity;
    var oldQueue = new Array( oldCapacity );
    var length = this.length();

    arrayCopy( this, 0, oldQueue, 0, oldCapacity );
    this._capacity = capacity;
    this._makeCapacity();
    this._front = 0;
    if( oldFront + length <= oldCapacity ) {
        arrayCopy( oldQueue, oldFront, this, 0, length );
    }
    else {        var lengthBeforeWrapping =
            length - ( ( oldFront + length ) & ( oldCapacity - 1 ) );

        arrayCopy( oldQueue, oldFront, this, 0, lengthBeforeWrapping );
        arrayCopy( oldQueue, 0, this, lengthBeforeWrapping,
                    length - lengthBeforeWrapping );
    }
};

module.exports = Queue;

},{"./assert.js":2}],27:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray ) {

    var RacePromiseArray =
        require( "./race_promise_array.js" )(Promise, PromiseArray);

    function Promise$_Race( promises, useBound, caller ) {
        return Promise$_All(
            promises,
            RacePromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        ).promise();
    }

    Promise.race = function Promise$Race( promises ) {
        return Promise$_Race( promises, false, Promise.race );
    };

    Promise.prototype.race = function Promise$race() {
        return Promise$_Race( this, true, this.race );
    };

};

},{"./race_promise_array.js":28}],28:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, PromiseArray ) {
var util = require("./util.js");
var inherits = util.inherits;
function RacePromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( RacePromiseArray, PromiseArray );

RacePromiseArray.prototype._init =
function RacePromiseArray$_init() {
    this._init$( void 0, 0 );
};

RacePromiseArray.prototype._promiseFulfilled =
function RacePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    this._fulfill( value );

};
RacePromiseArray.prototype._promiseRejected =
function RacePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    this._reject( reason );
};

return RacePromiseArray;
};

},{"./util.js":36}],29:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var ASSERT = require( "./assert.js" );

    function Promise$_reducer( fulfilleds, initialValue ) {
        var fn = this;
        var receiver = void 0;
        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        var len = fulfilleds.length;
        var accum = void 0;
        var startIndex = 0;

        if( initialValue !== void 0 ) {
            accum = initialValue;
            startIndex = 0;
        }
        else {
            startIndex = 1;
            if( len > 0 ) {
                for( var i = 0; i < len; ++i ) {
                    if( fulfilleds[i] === void 0 &&
                        !(i in fulfilleds) ) {
                        continue;
                    }
                    accum = fulfilleds[i];
                    startIndex = i + 1;
                    break;
                }
            }
        }
        if( receiver === void 0 ) {
            for( var i = startIndex; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fn( accum, fulfilleds[i], i, len );
            }
        }
        else {
            for( var i = startIndex; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fn.call( receiver, accum, fulfilleds[i], i, len );
            }
        }
        return accum;
    }

    function Promise$_unpackReducer( fulfilleds ) {
        var fn = this.fn;
        var initialValue = this.initialValue;
        return Promise$_reducer.call( fn, fulfilleds, initialValue );
    }

    function Promise$_slowReduce(
        promises, fn, initialValue, useBound, caller ) {
        return initialValue._then( function callee( initialValue ) {
            return Promise$_Reduce(
                promises, fn, initialValue, useBound, callee );
        }, void 0, void 0, void 0, void 0, caller);
    }

    function Promise$_Reduce( promises, fn, initialValue, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === true ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        if( initialValue !== void 0 ) {
            if( Promise.is( initialValue ) ) {
                if( initialValue.isFulfilled() ) {
                    initialValue = initialValue._resolvedValue;
                }
                else {
                    return Promise$_slowReduce( promises,
                        fn, initialValue, useBound, caller );
                }
            }

            return Promise$_All( promises, PromiseArray, caller,
                useBound === true ? promises._boundTo : void 0 )
                .promise()
                ._then( Promise$_unpackReducer, void 0, void 0, {
                    fn: fn,
                    initialValue: initialValue
                }, void 0, Promise.reduce );
        }
        return Promise$_All( promises, PromiseArray, caller,
                useBound === true ? promises._boundTo : void 0 ).promise()
            ._then( Promise$_reducer, void 0, void 0, fn, void 0, caller );
    }


    Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
        return Promise$_Reduce( promises, fn,
            initialValue, false, Promise.reduce);
    };

    Promise.prototype.reduce = function Promise$reduce( fn, initialValue ) {
        return Promise$_Reduce( this, fn, initialValue,
                                true, this.reduce );
    };
};

},{"./assert.js":2}],30:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var global = require("./global.js");
var ASSERT = require("./assert.js");
var schedule;
if( typeof process !== "undefined" && process !== null &&
    typeof process.cwd === "function" ) {
    if( typeof global.setImmediate !== "undefined" ) {
        schedule = function Promise$_Scheduler( fn ) {
            global.setImmediate( fn );
        };
    }
    else {
        schedule = function Promise$_Scheduler( fn ) {
            process.nextTick( fn );
        };
    }
}
else if( ( typeof MutationObserver === "function" ||
        typeof WebkitMutationObserver === "function" ||
        typeof WebKitMutationObserver === "function" ) &&
        typeof document !== "undefined" &&
        typeof document.createElement === "function" ) {


    schedule = (function(){
        var MutationObserver = global.MutationObserver ||
            global.WebkitMutationObserver ||
            global.WebKitMutationObserver;
        var div = document.createElement("div");
        var queuedFn = void 0;
        var observer = new MutationObserver(
            function Promise$_Scheduler() {
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
            }
        );
        var cur = true;
        observer.observe( div, {
            attributes: true,
            childList: true,
            characterData: true
        });
        return function Promise$_Scheduler( fn ) {
            queuedFn = fn;
            cur = !cur;
            div.setAttribute( "class", cur ? "foo" : "bar" );
        };

    })();
}
else if ( typeof global.postMessage === "function" &&
    typeof global.importScripts !== "function" &&
    typeof global.addEventListener === "function" &&
    typeof global.removeEventListener === "function" ) {

    var MESSAGE_KEY = "bluebird_message_key_" + Math.random();
    schedule = (function(){
        var queuedFn = void 0;

        function Promise$_Scheduler(e) {
            if(e.source === global &&
                e.data === MESSAGE_KEY) {
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
            }
        }

        global.addEventListener( "message", Promise$_Scheduler, false );

        return function Promise$_Scheduler( fn ) {
            queuedFn = fn;
            global.postMessage(
                MESSAGE_KEY, "*"
            );
        };

    })();
}
else if( typeof MessageChannel === "function" ) {
    schedule = (function(){
        var queuedFn = void 0;

        var channel = new MessageChannel();
        channel.port1.onmessage = function Promise$_Scheduler() {
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
        };

        return function Promise$_Scheduler( fn ) {
            queuedFn = fn;
            channel.port2.postMessage( null );
        };
    })();
}
else if( global.setTimeout ) {
    schedule = function Promise$_Scheduler( fn ) {
        setTimeout( fn, 4 );
    };
}
else {
    schedule = function Promise$_Scheduler( fn ) {
        fn();
    };
}

module.exports = schedule;

},{"./assert.js":2,"./global.js":14}],31:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray ) {

    var SettledPromiseArray = require( "./settled_promise_array.js" )(
        Promise, PromiseArray);

    function Promise$_Settle( promises, useBound, caller ) {
        return Promise$_All(
            promises,
            SettledPromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        ).promise();
    }

    Promise.settle = function Promise$Settle( promises ) {
        return Promise$_Settle( promises, false, Promise.settle );
    };

    Promise.prototype.settle = function Promise$settle() {
        return Promise$_Settle( this, true, this.settle );
    };

};
},{"./settled_promise_array.js":32}],32:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, PromiseArray ) {
var ASSERT = require("./assert.js");
var PromiseInspection = require( "./promise_inspection.js" );
var util = require("./util.js");
var inherits = util.inherits;
function SettledPromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( SettledPromiseArray, PromiseArray );

SettledPromiseArray.prototype._promiseResolved =
function SettledPromiseArray$_promiseResolved( index, inspection ) {
    this._values[ index ] = inspection;
    var totalResolved = ++this._totalResolved;
    if( totalResolved >= this._length ) {
        this._fulfill( this._values );
    }
};

SettledPromiseArray.prototype._promiseFulfilled =
function SettledPromiseArray$_promiseFulfilled( value, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._resolvedValue = value;
    this._promiseResolved( index, ret );
};
SettledPromiseArray.prototype._promiseRejected =
function SettledPromiseArray$_promiseRejected( reason, index ) {
    if( this._isResolved() ) return;
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._resolvedValue = reason;
    this._promiseResolved( index, ret );
};

return SettledPromiseArray;
};
},{"./assert.js":2,"./promise_inspection.js":20,"./util.js":36}],33:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var SomePromiseArray = require( "./some_promise_array.js" )(PromiseArray);
    var ASSERT = require( "./assert.js" );

    function Promise$_Some( promises, howMany, useBound, caller ) {
        if( ( howMany | 0 ) !== howMany ) {
            return apiRejection("howMany must be an integer");
        }
        var ret = Promise$_All(
            promises,
            SomePromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        );
        ret.setHowMany( howMany );
        return ret.promise();
    }

    Promise.some = function Promise$Some( promises, howMany ) {
        return Promise$_Some( promises, howMany, false, Promise.some );
    };

    Promise.prototype.some = function Promise$some( count ) {
        return Promise$_Some( this, count, true, this.some );
    };

};
},{"./assert.js":2,"./some_promise_array.js":34}],34:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function ( PromiseArray ) {
var util = require("./util.js");
var inherits = util.inherits;
var isArray = util.isArray;

function SomePromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
    this._howMany = 0;
    this._unwrap = false;
}
inherits( SomePromiseArray, PromiseArray );

SomePromiseArray.prototype._init = function SomePromiseArray$_init() {
    this._init$( void 0, 1 );
    var isArrayResolved = isArray( this._values );
    this._holes = isArrayResolved
        ? this._values.length - this.length()
        : 0;

    if( !this._isResolved() && isArrayResolved ) {
        this._howMany = Math.max(0, Math.min( this._howMany, this.length() ) );
        if( this.howMany() > this._canPossiblyFulfill()  ) {
            this._reject( [] );
        }
    }
};

SomePromiseArray.prototype.setUnwrap = function SomePromiseArray$setUnwrap() {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function SomePromiseArray$howMany() {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany =
function SomePromiseArray$setHowMany( count ) {
    if( this._isResolved() ) return;
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled =
function SomePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    this._addFulfilled( value );
    if( this._fulfilled() === this.howMany() ) {
        this._values.length = this.howMany();
        if( this.howMany() === 1 && this._unwrap ) {
            this._fulfill( this._values[0] );
        }
        else {
            this._fulfill( this._values );
        }
    }

};
SomePromiseArray.prototype._promiseRejected =
function SomePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    this._addRejected( reason );

    if( this.howMany() > this._canPossiblyFulfill() ) {
        if( this._values.length === this.length() ) {
            this._reject([]);
        }
        else {
            this._reject( this._values.slice( this.length() + this._holes ) );
        }
    }
};

SomePromiseArray.prototype._fulfilled = function SomePromiseArray$_fulfilled() {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function SomePromiseArray$_rejected() {
    return this._values.length - this.length() - this._holes;
};

SomePromiseArray.prototype._addRejected =
function SomePromiseArray$_addRejected( reason ) {
    this._values.push( reason );
};

SomePromiseArray.prototype._addFulfilled =
function SomePromiseArray$_addFulfilled( value ) {
    this._values[ this._totalResolved++ ] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill =
function SomePromiseArray$_canPossiblyFulfill() {
    return this.length() - this._rejected();
};

return SomePromiseArray;
};

},{"./util.js":36}],35:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
module.exports = function( Promise ) {
    var PromiseInspection = require( "./promise_inspection.js" );

    Promise.prototype.inspect = function Promise$inspect() {
        return new PromiseInspection( this );
    };
};

},{"./promise_inspection.js":20}],36:[function(require,module,exports){
/**
 * Copyright (c) 2013 Petka Antonov
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
"use strict";
var global = require("./global.js");
var ASSERT = require("./assert.js");
var haveGetters = (function(){
    try {
        var o = {};
        Object.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch(e) {
        return false;
    }

})();

var ensurePropertyExpansion = function( obj, prop, value ) {
    try {
        notEnumerableProp( obj, prop, value );
        return obj;
    }
    catch( e ) {
        var ret = {};
        var keys = Object.keys( obj );
        for( var i = 0, len = keys.length; i < len; ++i ) {
            try {
                var key = keys[i];
                ret[key] = obj[key];
            }
            catch( err ) {
                ret[key] = err;
            }
        }
        notEnumerableProp( ret, prop, value );
        return ret;
    }
};

var canEvaluate = (function() {
    if( typeof window !== "undefined" && window !== null &&
        typeof window.document !== "undefined" &&
        typeof navigator !== "undefined" && navigator !== null &&
        typeof navigator.appName === "string" &&
        window === global ) {
        return false;
    }
    return true;
})();

function deprecated( msg ) {
    if( typeof console !== "undefined" && console !== null &&
        typeof console.warn === "function" ) {
        console.warn( "Bluebird: " + msg );
    }
}

var isArray = Array.isArray || function( obj ) {
    return obj instanceof Array;
};



var errorObj = {e: {}};
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

function tryCatchApply( fn, args, receiver ) {
    try {
        return fn.apply( receiver, args );
    }
    catch( e ) {
        errorObj.e = e;
        return errorObj;
    }
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

function asString( val ) {
    return typeof val === "string" ? val : ( "" + val );
}

function isPrimitive( val ) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject( value ) {
    return !isPrimitive( value );
}

function maybeWrapAsError( maybeError ) {
    if( !isPrimitive( maybeError ) ) return maybeError;

    return new Error( asString( maybeError ) );
}

function withAppended( target, appendee ) {
    var len = target.length;
    var ret = new Array( len + 1 );
    var i;
    for( i = 0; i < len; ++i ) {
        ret[ i ] = target[ i ];
    }
    ret[ i ] = appendee;
    return ret;
}


function notEnumerableProp( obj, name, value ) {
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    Object.defineProperty( obj, name, descriptor );
    return obj;
}

module.exports ={
    isArray: isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    ensurePropertyExpansion: ensurePropertyExpansion,
    canEvaluate: canEvaluate,
    deprecated: deprecated,
    errorObj: errorObj,
    tryCatch1: tryCatch1,
    tryCatch2: tryCatch2,
    tryCatchApply: tryCatchApply,
    inherits: inherits,
    withAppended: withAppended,
    asString: asString,
    maybeWrapAsError: maybeWrapAsError
};

},{"./assert.js":2,"./global.js":14}]},{},[4])
(4)
//trick uglify-js into not minifying
});

;