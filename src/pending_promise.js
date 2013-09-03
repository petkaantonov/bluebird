var PendingPromise = (function() {

/**
 * Deferred
 *
 *
 */
function PendingPromise( promise ) {
    this.promise = promise;
    this.fulfill = bindDefer( this.fulfill, this );
    this.reject = bindDefer( this.reject, this );
    this.update = bindDefer( this.update, this );
}
var method = PendingPromise.prototype;

method.toString = function() {
    return "[object PendingPromise]";
};

method.fulfill = function( value ) {
    this.promise._fulfill( value );
};

method.reject = function( value ) {
    this.promise._reject( value );
};

method.update = function( value ) {
    this.promise._update( value );
};




return PendingPromise;})();