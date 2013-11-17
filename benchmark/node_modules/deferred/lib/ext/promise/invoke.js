// 'invoke' - Promise extension
//
// promise.invoke(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls method that returns immediately.
// 'name' can be method name or method itself.

'use strict';

var isCallable       = require('es5-ext/lib/Object/is-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args) {
	try {
		return apply.call(fn, this, args);
	} catch (e) {
		return e;
	}
};

deferred.extend('invoke', function (method/*, …args*/) {
	var def;
	if (!this.pending) {
		this.pending = [];
	}
	def = deferred();
	this.pending.push('invoke', [arguments, def.resolve]);
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
			resolve(applyFn.call(this, fn, args));
		}.bind(this.value), resolve);
	} else {
		resolve(applyFn.call(this.value, fn, args));
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
			def.resolve(applyFn.call(this, method, args));
		}.bind(this.value), def.resolve);
		return def.promise;
	}
	return deferred(applyFn.call(this.value, method, args));
});
