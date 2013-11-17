// Used by promise extensions that are based on array extensions.

'use strict';

var callable = require('es5-ext/lib/Object/valid-callable')
  , deferred = require('../../deferred');

module.exports = function (name, ext) {
	deferred.extend(name, function (cb) {
		var def;
		((cb == null) || callable(cb));
		if (!this.pending) {
			this.pending = [];
		}
		def = deferred();
		this.pending.push(name, [arguments, def.resolve]);
		return def.promise;
	}, function (args, resolve) {
		var result;
		if (this.failed) {
			resolve(this.value);
		} else {
			try {
				result = ext.apply(this.value, args);
			} catch (e) {
				result = e;
			}
			resolve(result);
		}
	}, function (cb) {
		((cb == null) || callable(cb));
		if (this.failed) return this;
		try {
			return ext.apply(this.value, arguments);
		} catch (e) {
			return deferred(e);
		}
	});
};
