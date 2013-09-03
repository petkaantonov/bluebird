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
    functionBuffer[ length + FUNCTION_OFFSET ] = fn;
    functionBuffer[ length + RECEIVER_OFFSET ] = receiver;
    functionBuffer[ length + ARGUMENT_OFFSET ] = arg;
    this._length = length + FUNCTION_SIZE;

    if( !this._isTickUsed ) {
        this._deferFn();
        this._isTickUsed = true;
    }
};

method._consumeFunctionBuffer = function() {
    var len = this._length;
    var functionBuffer = this._functionBuffer;
    if( len > 0 ) {
        for( var i = 0; i < this._length; i += FUNCTION_SIZE ) {
            functionBuffer[ i + FUNCTION_OFFSET ].call(
                functionBuffer[ i + RECEIVER_OFFSET ],
                functionBuffer[ i + ARGUMENT_OFFSET ]
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
