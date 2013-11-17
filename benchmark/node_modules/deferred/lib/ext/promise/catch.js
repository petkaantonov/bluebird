// 'catch' - Promise extension
//
// promise.catch(cb)
//
// Same as `then` but accepts only onFail callback

'use strict';

var isCallable = require('es5-ext/lib/Object/is-callable')
  , validValue = require('es5-ext/lib/Object/valid-value')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise');

deferred.extend('catch', function (cb) {
	var def;
	validValue(cb);
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('catch', [cb, def.resolve]);
	return def.promise;
}, function (cb, resolve) {
	var value;
	if (!this.failed) {
		resolve(this.value);
		return;
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) resolve(cb.value);
			else cb.done(resolve, resolve);
			return;
		}
		try { value = cb(this.value); } catch (e) { value = e; }
		resolve(value);
		return;
	}
	resolve(cb);
}, function (cb) {
	var value;
	validValue(cb);
	if (!this.failed) return this;
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		try { value = cb(this.value); } catch (e) { value = e; }
		return deferred(value);
	}
	return deferred(cb);
});
