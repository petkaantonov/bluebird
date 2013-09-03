var PromiseError = (function() {

PromiseError.prototype = new Error();
PromiseError.prototype.constructor = PromiseError;

function PromiseError( msg, data ) {
    if( typeof Error.captureStackTrace !== "undefined" ) {
        Error.captureStackTrace( this, this.constructor );
    }
    Error.apply( this, arguments );
    this.message = msg;
    this.data = data;
}

return PromiseError; })();