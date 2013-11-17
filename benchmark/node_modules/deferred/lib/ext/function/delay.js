// Delay function execution, return promise for delayed function result

'use strict';

var apply    = Function.prototype.apply
  , callable = require('es5-ext/lib/Object/valid-callable')
  , deferred = require('../../deferred')

  , delayed;

delayed = function (fn, args, resolve) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		value = e;
	}
	resolve(value);
};

module.exports = function (timeout) {
	var fn, result;
	fn = callable(this);
	result = function () {
		var def = deferred();
		setTimeout(delayed.bind(this, fn, arguments, def.resolve), timeout);
		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};
