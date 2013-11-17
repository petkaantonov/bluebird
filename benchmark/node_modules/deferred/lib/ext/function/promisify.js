// Promisify asynchronous function

'use strict';

var toArray          = require('es5-ext/lib/Array/from')
  , callable         = require('es5-ext/lib/Object/valid-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args, resolve) {
	args = toArray(args);
	apply.call(fn,  this, args.concat(function (error, result) {
		if (error == null) {
			resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			resolve(error);
		}
	}));
};

module.exports = function (length) {
	var fn, result;
	fn = callable(this);
	if (fn.returnsPromise) {
		return fn;
	}
	if (length != null) {
		length = length >>> 0;
	}
	result = function () {
		var args, def;
		args = processArguments(arguments, length);

		if (isPromise(args)) {
			if (args.failed) {
				return args;
			}
			def = deferred();
			args.end(function (args) {
				try {
					applyFn.call(this, fn, args, def.resolve);
				} catch (e) {
					def.resolve(e);
				}
			}.bind(this), def.resolve);
		} else {
			def = deferred();
			try {
				applyFn.call(this, fn, args, def.resolve);
			} catch (e) {
				def.resolve();
				throw e;
			}
		}

		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};
