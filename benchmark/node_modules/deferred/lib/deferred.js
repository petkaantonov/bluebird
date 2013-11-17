// Returns function that returns deferred or promise object.
//
// 1. If invoked without arguments then deferred object is returned
//    Deferred object consist of promise (unresolved) function and resolve
//    function through which we resolve promise
// 2. If invoked with one argument then promise is returned which resolved value
//    is given argument. Argument may be any value (even undefined),
//    if it's promise then same promise is returned
// 3. If invoked with more than one arguments then promise that resolves with
//    array of all resolved arguments is returned.

'use strict';

var isError    = require('es5-ext/lib/Error/is-error')
  , validError = require('es5-ext/lib/Error/valid-error')
  , noop       = require('es5-ext/lib/Function/noop')
  , isPromise  = require('./is-promise')

  , every = Array.prototype.every, push = Array.prototype.push

  , Deferred, createDeferred, count = 0, timeout, extendShim, ext
  , protoSupported = Boolean(isPromise.__proto__);

extendShim = function (promise) {
	ext._names.forEach(function (name) {
		promise[name] = function () {
			return promise.__proto__[name].apply(promise, arguments);
		};
	});
	promise.returnsPromise = true;
	promise.resolved = promise.__proto__.resolved;
};

Deferred = function () {
	var promise = function (win, fail) { return promise.then(win, fail); };
	if (!count) {
		timeout = setTimeout(noop, 1e9);
	}
	++count;
	if (createDeferred._monitor) {
		promise.monitor = createDeferred._monitor();
	}
	promise.__proto__ = ext._unresolved;
	if (!protoSupported) { extendShim(promise); }
	(createDeferred._profile && createDeferred._profile());
	this.promise = promise;
	this.resolve = this.resolve.bind(this);
	this.reject = this.reject.bind(this);
};

Deferred.prototype = {
	resolved: false,
	resolve: function (value) {
		var i, name, data;
		if (this.resolved) {
			return this.promise;
		}
		this.resolved = true;
		if (!--count) {
			clearTimeout(timeout);
		}
		if (this.promise.monitor) {
			clearTimeout(this.promise.monitor);
		}
		if (isPromise(value)) {
			if (!value.resolved) {
				if (!value.dependencies) {
					value.dependencies = [];
				}
				value.dependencies.push(this.promise);
				if (this.promise.pending) {
					if (value.pending) {
						push.apply(value.pending, this.promise.pending);
						this.promise.pending = value.pending;
						if (this.promise.dependencies) {
							this.promise.dependencies.forEach(function self(dPromise) {
								dPromise.pending = value.pending;
								if (dPromise.dependencies) {
									dPromise.dependencies.forEach(self);
								}
							});
						}
					} else {
						value.pending = this.promise.pending;
					}
				} else if (value.pending) {
					this.promise.pending = value.pending;
				} else {
					this.promise.pending = value.pending = [];
				}
				return this.promise;
			}
			value = value.value;
		}
		this.promise.value = value;
		this.promise.failed = (value && isError(value)) || false;
		this.promise.__proto__ = ext._resolved;
		if (!protoSupported) {
			this.promise.resolved = true;
		}
		if (this.promise.dependencies) {
			this.promise.dependencies.forEach(function self(dPromise) {
				dPromise.value = value;
				dPromise.failed = this.failed;
				dPromise.__proto__ = ext._resolved;
				if (!protoSupported) {
					dPromise.resolved = true;
				}
				delete dPromise.pending;
				if (dPromise.dependencies) {
					dPromise.dependencies.forEach(self, this);
					delete dPromise.dependencies;
				}
			}, this.promise);
			delete this.promise.dependencies;
		}
		if ((data = this.promise.pending)) {
			for (i = 0; (name = data[i]); ++i) {
				ext._onresolve[name].apply(this.promise, data[++i]);
			}
			delete this.promise.pending;
		}
		return this.promise;
	},
	reject: function (error) { return this.resolve(validError(error)); }
};

module.exports = createDeferred = function (value) {
	var l, d, waiting, initialized, result, promise;
	if ((l = arguments.length)) {
		if (l > 1) {
			d = new Deferred();
			waiting = 0;
			result = new Array(l);
			every.call(arguments, function (value, index) {
				if (isPromise(value)) {
					++waiting;
					value.end(function (value) {
						result[index] = value;
						if (!--waiting && initialized) {
							d.resolve(result);
						}
					}, d.resolve);
				} else if (!isError(value)) {
					result[index] = value;
				} else {
					d.resolve(value);
					return false;
				}
				return true;
			});
			initialized = true;
			if (!waiting) {
				d.resolve(result);
			}
			return d.promise;
		}
		if (isPromise(value)) return value;
		promise = function (win, fail) { return promise.then(win, fail); };
		promise.value = value;
		promise.failed = isError(value);
		promise.__proto__ = ext._resolved;
		if (!protoSupported) { extendShim(promise); }
		if (createDeferred._profile) createDeferred._profile(true);
		return promise;
	}
	return new Deferred();
};

createDeferred.Deferred = Deferred;
ext = require('./_ext');
