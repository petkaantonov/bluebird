var util = require( "./util.js" );
var errors = require( "./errors.js");
var TimeoutError = errors.TimeoutError;
var async = require( "./async.js" );
var haveGetters = util.haveGetters;
var nodebackForResolver = util.nodebackForResolver;

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

PromiseResolver.prototype.toString = function PromiseResolver$toString() {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.fulfill = function PromiseResolver$fulfill( value ) {
    if( this.promise._tryAssumeStateOf( value, false ) ) {
        return;
    }
    async.invoke( this.promise._fulfill, this.promise, value );
};

PromiseResolver.prototype.reject = function PromiseResolver$reject( reason ) {
    this.promise._attachExtraTrace( reason );
    async.invoke( this.promise._reject, this.promise, reason );
};

PromiseResolver.prototype.progress =
function PromiseResolver$progress( value ) {
    async.invoke( this.promise._progress, this.promise, value );
};

PromiseResolver.prototype.cancel = function PromiseResolver$cancel() {
    async.invoke( this.promise.cancel, this.promise, void 0 );
};

PromiseResolver.prototype.timeout = function PromiseResolver$timeout() {
    this.reject( new TimeoutError( "timeout" ) );
};

PromiseResolver.prototype.isResolved = function PromiseResolver$isResolved() {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function PromiseResolver$toJSON() {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;
