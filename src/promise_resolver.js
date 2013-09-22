var PromiseResolver = (function() {

/**
 * Wraps a promise object and can be used to control
 * the fate of that promise. Give .promise to clients
 * and keep the resolver to yourself.
 *
 * Something like a "Deferred".
 *
 * @constructor
 */
function PromiseResolver( promise ) {
    this.promise = promise;
}
var method = PromiseResolver.prototype;

/**
 * @return {string}
 */
method.toString = function PromiseResolver$toString() {
    return "[object PromiseResolver]";
};

/**
 * Resolve the promise by fulfilling it with the
 * given value.
 *
 * @param {dynamic} value The value to fulfill the promise with.
 *
 */
method.fulfill = function PromiseResolver$fulfill( value ) {
    if( this.promise._tryAssumeStateOf( value, false ) ) {
        return;
    }
    async.invoke( this.promise._fulfill, this.promise, value );
};

/**
 * Resolve the promise by rejecting it with the
 * given reason.
 *
 * @param {dynamic} reason The reason why the promise was rejected.
 *
 */
method.reject = function PromiseResolver$reject( reason ) {
    this.promise._attachExtraTrace( reason );
    async.invoke( this.promise._reject, this.promise, reason );
};

/**
 * Notify the listeners of the promise of progress.
 *
 * @param {dynamic} value The reason why the promise was rejected.
 *
 */
method.progress = function PromiseResolver$progress( value ) {
    async.invoke( this.promise._progress, this.promise, value );
};

/**
 * Cancel the promise.
 *
 */
method.cancel = function PromiseResolver$cancel() {
    async.invoke( this.promise.cancel, this.promise, void 0 );
};

/**
 * Resolves the promise by rejecting it with the reason
 * TimeoutError
 */
method.timeout = function PromiseResolver$timeout() {
    this.reject( new TimeoutError( "timeout" ) );
};

/**
 * See if the promise is resolved.
 *
 * @return {boolean}
 */
method.isResolved = function PromiseResolver$isResolved() {
    return this.promise.isResolved();
};

/**
 * For JSON serialization.
 *
 * @return {dynamic}
 */
method.toJSON = function PromiseResolver$toJSON() {
    return this.promise.toJSON();
};


return PromiseResolver;})();