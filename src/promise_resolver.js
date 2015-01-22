"use strict";
var util = require("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = require("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = require("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            INLINE_SLICE(args, arguments, 1);
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
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
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

/**
 * @return {string}
 */
PromiseResolver.prototype.toString = function () {
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
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError(UNBOUND_RESOLVER_INVOCATION);
    }
    this.promise._resolveCallback(value);
};

/**
 * Resolve the promise by rejecting it with the
 * given reason.
 *
 * @param {dynamic} reason The reason why the promise was rejected.
 *
 */
PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError(UNBOUND_RESOLVER_INVOCATION);
    }
    this.promise._rejectCallback(reason);
};

/**
 * Notify the listeners of the promise of progress.
 *
 * @param {dynamic} value The reason why the promise was rejected.
 *
 */
PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError(UNBOUND_RESOLVER_INVOCATION);
    }
    this.promise._progress(value);
};

/**
 * Cancel the promise.
 *
 */
PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

/**
 * Resolves the promise by rejecting it with the reason
 * TimeoutError
 */
PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

/**
 * See if the promise is resolved.
 *
 * @return {boolean}
 */
PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

/**
 * For JSON serialization.
 *
 * @return {dynamic}
 */
PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;
