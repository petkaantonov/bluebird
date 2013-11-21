"use strict";
var util = require( "./util.js" );
var maybeWrapAsError = util.maybeWrapAsError;
var errors = require( "./errors.js");
var TimeoutError = errors.TimeoutError;
var RejectionError = errors.RejectionError;
var async = require( "./async.js" );
var haveGetters = util.haveGetters;

function isUntypedError( obj ) {
    return obj instanceof Error &&
        Object.getPrototypeOf( obj ) === Error.prototype;
}

function wrapAsRejectionError( obj ) {
    if( isUntypedError( obj ) ) {
        return new RejectionError( obj );
    }
    return obj;
}

function nodebackForResolver( resolver ) {
    function PromiseResolver$_callback( err, value ) {
        if( err ) {
            resolver.reject( wrapAsRejectionError( maybeWrapAsError( err ) ) );
        }
        else {
            if( arguments.length > 2 ) {
                INLINE_SLICE(args, arguments, 1);
                resolver.fulfill( args );
            }
            else {
                resolver.fulfill( value );
            }
        }
    }
    return PromiseResolver$_callback;
}


/**
 * Wraps a promise object and can be used to control
 * the fate of that promise. Give .promise to clients
 * and keep the resolver to yourself.
 *
 * Something like a "Deferred".
 *
 * @constructor
 */
var PromiseResolver;
if( !haveGetters ) {
    PromiseResolver = function PromiseResolver( promise ) {
        this.promise = promise;
        this.asCallback = nodebackForResolver( this );
    };
}
else {
    PromiseResolver = function PromiseResolver( promise ) {
        this.promise = promise;
    };
}
if( haveGetters ) {
    Object.defineProperty( PromiseResolver.prototype, "asCallback", {
        get: function() {
            return nodebackForResolver( this );
        }
    });
}

PromiseResolver._nodebackForResolver = nodebackForResolver;

/**
 * @return {string}
 */
PromiseResolver.prototype.toString = function PromiseResolver$toString() {
    return "[object PromiseResolver]";
};

/**
 * Resolve the promise by fulfilling it with the
 * given value.
 *
 * @param {dynamic} value The value to fulfill the promise with.
 *
 */
PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function PromiseResolver$resolve( value ) {
    if( this.promise._tryAssumeStateOf( value, MAY_SYNC ) ) {
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
PromiseResolver.prototype.reject = function PromiseResolver$reject( reason ) {
    this.promise._attachExtraTrace( reason );
    async.invoke( this.promise._reject, this.promise, reason );
};

/**
 * Notify the listeners of the promise of progress.
 *
 * @param {dynamic} value The reason why the promise was rejected.
 *
 */
PromiseResolver.prototype.progress =
function PromiseResolver$progress( value ) {
    async.invoke( this.promise._progress, this.promise, value );
};

/**
 * Cancel the promise.
 *
 */
PromiseResolver.prototype.cancel = function PromiseResolver$cancel() {
    async.invoke( this.promise.cancel, this.promise, void 0 );
};

/**
 * Resolves the promise by rejecting it with the reason
 * TimeoutError
 */
PromiseResolver.prototype.timeout = function PromiseResolver$timeout() {
    this.reject( new TimeoutError( "timeout" ) );
};

/**
 * See if the promise is resolved.
 *
 * @return {boolean}
 */
PromiseResolver.prototype.isResolved = function PromiseResolver$isResolved() {
    return this.promise.isResolved();
};

/**
 * For JSON serialization.
 *
 * @return {dynamic}
 */
PromiseResolver.prototype.toJSON = function PromiseResolver$toJSON() {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;
