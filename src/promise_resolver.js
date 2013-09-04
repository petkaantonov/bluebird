var PromiseResolver = (function() {

/**
 * Deferred
 *
 *
 */
function PromiseResolver( promise ) {
    this.promise = promise;
}
var method = PromiseResolver.prototype;

method.toString = function() {
    return "[object PromiseResolver]";
};

method.fulfill = function( value ) {
    async.call( this.promise._fulfill, this.promise, value );
};

method.reject = function( value ) {
    async.call( this.promise._reject, this.promise, value );
};

method.progress = function( value ) {
    async.call( this.promise._progress, this.promise, value );
};

method.cancel = function() {
    async.call( this.promise.cancel, this.promise, void 0 );
};

method.timeout = function() {
    async.call(
        this.promise._reject,
        this.promise,
        new TimeoutError( "timeout" )
    );
};

method.isResolved = function() {
    return this._promise.isResolved();
};


return PromiseResolver;})();