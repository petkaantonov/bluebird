var Async = (function() {

var deferFn;
if( typeof process !== "undefined" && process !== null &&
    typeof process.cwd === "function" ) {
    if( typeof global.setImmediate !== "undefined" ) {
        deferFn = function Promise$_Deferred( fn ) {
            global.setImmediate( fn );
        };
    }
    else {
        deferFn = function Promise$_Deferred( fn ) {
            process.nextTick( fn );
        };
    }
}
else if( ( typeof MutationObserver === "function" ||
        typeof WebkitMutationObserver === "function" ) &&
        typeof document !== "undefined" &&
        typeof document.createElement === "function" ) {

    var MutationObserver = global.MutationObserver ||
        global.WebkitMutationObserver;
    deferFn = (function(){
        var div = document.createElement("div");
        var queuedFn = void 0;
        var observer = new MutationObserver(
            function Promise$_Deferred() {
                ASSERT( queuedFn !== void 0 );
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
        return function Promise$_Deferred( fn ) {
            ASSERT( queuedFn === void 0 );
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
    deferFn = (function(){
        var queuedFn = void 0;

        function Promise$_Deferred(e) {
            if(e.source === global &&
                e.data === MESSAGE_KEY) {
                ASSERT( queuedFn !== void 0 );
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
            }
        }

        global.addEventListener( "message", Promise$_Deferred, false );

        return function Promise$_Deferred( fn ) {
            ASSERT( queuedFn === void 0 );
            queuedFn = fn;
            global.postMessage(
                MESSAGE_KEY, "*"
            );
        };

    })();
}
else if( typeof MessageChannel === "function" ) {
    deferFn = (function(){
        var queuedFn = void 0;

        var channel = new MessageChannel();
        channel.port1.onmessage = function Promise$_Deferred() {
                ASSERT( queuedFn !== void 0 );
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
        };

        return function Promise$_Deferred( fn ) {
            ASSERT( queuedFn === void 0 );
            queuedFn = fn;
            channel.port2.postMessage( null );
        };
    })();
}
else if( global.setTimeout ) {
    deferFn = function Promise$_Deferred( fn ) {
        setTimeout( fn, 4 );
    };
}
else {
    deferFn = function Promise$_Deferred( fn ) {
        fn();
    };
}

CONSTANT(FUNCTION_OFFSET, 0);
CONSTANT(RECEIVER_OFFSET, 1);
CONSTANT(ARGUMENT_OFFSET, 2);
CONSTANT(FUNCTION_SIZE, 3);

function Async() {
    this._isTickUsed = false;
    this._length = 0;
    this._lateBuffer = [];
    var functionBuffer = this._functionBuffer =
        new Array( 1000 * FUNCTION_SIZE );
    var self = this;
    //Optimized around the fact that no arguments
    //need to be passed
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

//When the fn absolutely needs to be called after
//the queue has been completely flushed
method.invokeLater = function Async$invokeLater( fn, receiver, arg ) {
    ASSERT( typeof fn === "function" );
    ASSERT( arguments.length === 3 );
    this._lateBuffer.push( fn, receiver, arg );
    this._queueTick();
};

method.invoke = function Async$invoke( fn, receiver, arg ) {
    ASSERT( typeof fn === "function" );
    ASSERT( arguments.length === 3 );
    var functionBuffer = this._functionBuffer,
        len = functionBuffer.length,
        length = this._length;

    if( length === len ) {
        //direct index modifications past .length caused out of bounds
        //accesses which caused deoptimizations
        functionBuffer.push( fn, receiver, arg );
    }
    else {
        ASSERT( length < len );
        functionBuffer[ length + FUNCTION_OFFSET ] = fn;
        functionBuffer[ length + RECEIVER_OFFSET ] = receiver;
        functionBuffer[ length + ARGUMENT_OFFSET ] = arg;
    }
    this._length = length + FUNCTION_SIZE;
    this._queueTick();
};

method._consumeFunctionBuffer = function Async$_consumeFunctionBuffer() {
    var functionBuffer = this._functionBuffer;
    ASSERT( this._isTickUsed );
    //Must not cache the length
    for( var i = 0; i < this._length; i += FUNCTION_SIZE ) {
        functionBuffer[ i + FUNCTION_OFFSET ].call(
            functionBuffer[ i + RECEIVER_OFFSET ],
            functionBuffer[ i + ARGUMENT_OFFSET ] );

        //Must clear garbage immediately otherwise
        //high promotion rate is caused with long
        //sequence chains which leads to mass deoptimization
        functionBuffer[ i + FUNCTION_OFFSET ] =
            functionBuffer[ i + RECEIVER_OFFSET ] =
            functionBuffer[ i + ARGUMENT_OFFSET ] =
            void 0;
    }
    this._reset();
    this._consumeLateBuffer();
};

method._consumeLateBuffer = function Async$_consumeLateBuffer() {
    if( this._lateBuffer.length ) {
        var buffer = this._lateBuffer;
        for( var i = 0; i < buffer.length; i+= FUNCTION_SIZE ) {
            var res = tryCatch1(
                buffer[ i + FUNCTION_OFFSET ],
                buffer[ i + RECEIVER_OFFSET ],
                buffer[ i + ARGUMENT_OFFSET ]
            );
            if( res === errorObj ) {
                //We are going to throw - copy rest of the buffer
                //to be invocated in a later turn
                i += FUNCTION_SIZE;
                ASSERT( buffer.length - i >= 0 );
                var newBuffer = new Array( buffer.length - i );
                var c = 0;
                for( var j = i; j < buffer.length; j += FUNCTION_SIZE ) {
                    newBuffer[ c + FUNCTION_OFFSET ] = buffer[ j + FUNCTION_OFFSET ];
                    newBuffer[ c + RECEIVER_OFFSET ] = buffer[ j + RECEIVER_OFFSET ];
                    newBuffer[ c + ARGUMENT_OFFSET ] = buffer[ j + ARGUMENT_OFFSET ];
                    c += FUNCTION_SIZE;
                }
                this._lateBuffer = newBuffer;
                ASSERT( !this._isTickUsed );
                this._queueTick();
                throw res.e;
            }
        }
        buffer.length = 0;
    }
};

method._queueTick = function Async$_queue() {
    if( !this._isTickUsed ) {
        deferFn( this.consumeFunctionBuffer );
        this._isTickUsed = true;
    }
};

method._reset = function Async$_reset() {
    this._isTickUsed = false;
    this._length = 0;
};


return Async;})();

var async = new Async();