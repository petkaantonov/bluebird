function subError( nameProperty, defaultMessage ) {

    function SubError( message ) {
        if( Error.captureStackTrace ) {
            Error.captureStackTrace( this, this.constructor );
        }
        this.message = typeof message === "string" ? message : defaultMessage;
        this.name = nameProperty;

    }
    inherits( SubError, Error );
    return SubError;
}

var TypeError = global.TypeError;
if( typeof TypeError !== "function" ) {
    TypeError = subError( "TypeError", "type error" );
}
var CancellationError = subError("Cancel", "cancellation error" );
var TimeoutError = subError( "Timeout", "timeout error" );