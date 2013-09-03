var PendingPromise = (function() {

/**
 * Deferred
 *
 *
 */
function PendingPromise( promise ) {
    this.promise = promise;
}
var method = PendingPromise.prototype;

method.toString = function() {
    return "[object PendingPromise]";
};

method.fulfill = function( value ) {
    async.call( this.promise._fulfill, this.promise, value );
};

method.reject = function( value ) {
    async.call( this.promise._reject, this.promise, value );
};

method.update = function( value ) {
    async.call( this.promise._update, this.promise, value );
};




return PendingPromise;})();