// Promisify synchronous function

'use strict';

var callable         = require('es5-ext/lib/Object/valid-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args, resolve) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		value = e;
	}
	resolve(value);
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
				apply.call(this, fn, args, def.resolve);
			}.bind(this), def.resolve);
		} else {
			def = deferred();
			applyFn.call(this, fn, args, def.resolve);
		}

		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};
