// 'get' - Promise extension
//
// promise.get(name)
//
// Resolves with property of resolved object

'use strict';

var value    = require('es5-ext/lib/Object/valid-value')
  , deferred = require('../../deferred')

  , reduce = Array.prototype.reduce;

deferred.extend('get', function (/*…name*/) {
	var def;
	if (!this.pending) {
		this.pending = [];
	}
	def = deferred();
	this.pending.push('get', [arguments, def.resolve]);
	return def.promise;

}, function (args, resolve) {
	var result;
	if (this.failed) {
		resolve(this.value);
	}
	try {
		result = reduce.call(args, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		result = e;
	}
	return resolve(result);
}, function (/*…name*/) {
	var result;
	if (this.failed) {
		return this;
	}
	try {
		result = reduce.call(arguments, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		result = e;
	}
	return deferred(result);
});
