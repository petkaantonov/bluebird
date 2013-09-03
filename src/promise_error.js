var PromiseError = (function() {

PromiseError.prototype = create(Error.prototype);
PromiseError.prototype.constructor = PromiseError;

function PromiseError() {
    if( typeof Error.captureStackTrace !== "undefined" ) {
        Error.captureStackTrace( this, this.constructor );
    }
    Error.apply( this, arguments );
}

return PromiseError; })();