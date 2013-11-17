// 'invokeAsync' - Promise extension
//
// promise.invokeAsync(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls asynchronous method that takes callback
// (Node.js style).
// Do not pass callback, it's handled by internal implementation.
// 'name' can be method name or method itself.

'use strict';

var toArray          = require('es5-ext/lib/Array/from')
  , isCallable       = require('es5-ext/lib/Object/is-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args, resolve) {
	var result;
	if (fn.returnsPromise) {
		try {
			result = apply.call(fn, this, args);
		} catch (e) {
			result = e;
		}
		return resolve(result);
	}
	args = toArray(args).concat(function (error, result) {
		if (error == null) {
			resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			resolve(error);
		}
	});
	try {
		apply.call(fn, this, args);
	} catch (e2) {
		resolve(e2);
	}
};

deferred.extend('invokeAsync', function (method/*, …args*/) {
	var def;
	if (!this.pending) {
		this.pending = [];
	}
	def = deferred();
	this.pending.push('invokeAsync', [arguments, def.resolve]);
	return def.promise;
}, function (args, resolve) {
	var fn;
	if (this.failed) {
		resolve(this);
		return;
	}

	if (this.value == null) {
		resolve(new TypeError("Cannot use null or undefined"));
		return;
	}

	fn = args[0];
	if (!isCallable(fn)) {
		fn = String(fn);
		if (!isCallable(this.value[fn])) {
			resolve(new TypeError(fn + " is not a function"));
			return;
		}
		fn = this.value[fn];
	}

	args = processArguments(slice.call(args, 1));
	if (isPromise(args)) {
		if (args.failed) {
			resolve(args);
			return;
		}
		args.end(function (args) {
			applyFn.call(this, fn, args, resolve);
		}.bind(this.value), resolve);
	} else {
		applyFn.call(this.value, fn, args, resolve);
	}
}, function (method/*, …args*/) {
	var args, def;
	if (this.failed) {
		return this;
	}

	if (this.value == null) {
		return deferred(new TypeError("Cannot use null or undefined"));
	}

	if (!isCallable(method)) {
		method = String(method);
		if (!isCallable(this.value[method])) {
			return deferred(new TypeError(method + " is not a function"));
		}
		method = this.value[method];
	}

	args = processArguments(slice.call(arguments, 1));
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.end(function (args) {
			applyFn.call(this, method, args, def.resolve);
		}.bind(this.value), def.resolve);
	} else if (!method.returnsPromise) {
		def = deferred();
		applyFn.call(this.value, method, args, def.resolve);
	} else {
		return applyFn.call(this.value, method, args, deferred);
	}
	return def.promise;
});
