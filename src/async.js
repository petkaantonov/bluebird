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
        typeof WebkitMutationObserver === "function" ||
        typeof WebKitMutationObserver === "function" ) &&
        typeof document !== "undefined" &&
        typeof document.createElement === "function" ) {


    deferFn = (function(){
        var MutationObserver = global.MutationObserver ||
            global.WebkitMutationObserver ||
            global.WebKitMutationObserver;
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

CONSTANT(FUNCTION_SIZE, 3);

function Async() {
    this._isTickUsed = false;
    this._length = 0;
    this._lateBuffer = new Deque();
    this._functionBuffer = new Deque( 12500 * FUNCTION_SIZE );
    var self = this;
    //Optimized around the fact that no arguments
    //need to be passed
    this.consumeFunctionBuffer = function Async$consumeFunctionBuffer() {
        self._consumeFunctionBuffer();
    };
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
    var functionBuffer = this._functionBuffer;
    functionBuffer.push( fn, receiver, arg );
    this._length = functionBuffer.length();
    this._queueTick();
};

method._consumeFunctionBuffer = function Async$_consumeFunctionBuffer() {
    var functionBuffer = this._functionBuffer;
    ASSERT( this._isTickUsed );
    while( functionBuffer.length() > 0 ) {
        var fn = functionBuffer.shift();
        var receiver = functionBuffer.shift();
        var arg = functionBuffer.shift();
        fn.call( receiver, arg );
    }
    this._reset();
    this._consumeLateBuffer();
};

method._consumeLateBuffer = function Async$_consumeLateBuffer() {
    if( this._lateBuffer.length ) {
        var buffer = this._lateBuffer;
        while( buffer.length() > 0 ) {
            var fn = buffer.shift();
            var receiver = buffer.shift();
            var arg = buffer.shift();
            var res = tryCatch1( fn, receiver, arg );
            if( res === errorObj ) {
                ASSERT( !this._isTickUsed );
                this._queueTick();
                throw res.e;
            }
        }
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