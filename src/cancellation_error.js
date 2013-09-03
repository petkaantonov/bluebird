var CancellationError = (function() {

CancellationError.prototype = new PromiseError();
CancellationError.prototype.constructor = CancellationError;

function CancellationError() {
    PromiseError.apply( this, arguments );
    this.name = "cancel";
}


return CancellationError; })();