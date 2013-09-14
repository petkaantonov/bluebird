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
    var functionBuffer = this._functionBuffer = new Array( 1000 * FUNCTION_SIZE );
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

//When the fn absolutely needs to be called after
//the queue has been completely flushed
method.invokeLater = function( fn, receiver, arg ) {
    ASSERT( typeof fn, "function" );
    ASSERT( arguments.length, 3 );
    if( !this._isTickUsed ) {
        this.invoke( fn, receiver, arg );
        return;
    }
    this._backupBuffer.push( fn, receiver, arg );
};

method.invoke = function( fn, receiver, arg ) {
    ASSERT( typeof fn, "function" );
    ASSERT( arguments.length, 3 );
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

    if( !this._isTickUsed ) {
        deferFn( this.consumeFunctionBuffer );
        this._isTickUsed = true;
    }
};

method._consumeFunctionBuffer = function() {
    var functionBuffer = this._functionBuffer;
    ASSERT( this._length > 0 );
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
        async.invoke( fn, receiver, arg );
    };
};
