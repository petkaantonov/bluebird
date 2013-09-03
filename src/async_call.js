//Ensure in-order async calling of functions
//with minimal use of async functions like setTimeout
var defer = (function() {

    var functionBuffer = new Array( 300 );
    for( var i = 0, len = functionBuffer.length; i < len; ++i ) {
        functionBuffer[i] = void 0;
    }

    var length = 0;
    var wasDeferred = false;

    function consumeFunctionBuffer() {
        var len = length;
        if( len > 0 ) {
            var copy = new Array(len);
            for( var i = 0, len = copy.length; i < len; ++i ) {
                copy[i] = functionBuffer[i];
                functionBuffer[i] = void 0;
            }
            reset();
            for( var i = 0; i < len; i += FUNCTION_SIZE ) {
                copy[ i + FUNCTION_OFFSET ].call(
                    copy[ i + RECEIVER_OFFSET ],
                    copy[ i + ARGUMENT_OFFSET ]
                );
            }
        }
        else reset();

    }

    function reset() {
        length = 0;
        wasDeferred = false;
    }

    var deferFn = typeof process !== "undefined" ?
            ( typeof global.setImmediate !== "undefined"
                ? function(){
                    global.setImmediate( consumeFunctionBuffer );
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

var bindDefer = function( fn, receiver ) {
    return function( arg ) {
        defer( fn, receiver, arg );
    };
};
