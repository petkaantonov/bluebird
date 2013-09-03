var CancelException = (function() {

CancelException.prototype = create(PromiseError.prototype);
CancelException.prototype.constructor = CancelException;

function CancelException() {
    PromiseError.apply( this, arguments );
    this.name = "Cancel";
}


return CancelException; })();