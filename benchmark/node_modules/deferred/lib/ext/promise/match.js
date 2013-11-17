// 'match' - Promise extensions
//
// promise.match(onsuccess, onerror)
//
// Matches eventual list result onto function arguments,
// otherwise works same as 'then' (promise function itself)

'use strict';

var match      = require('es5-ext/lib/Function/prototype/match')
  , callable   = require('es5-ext/lib/Object/valid-callable')
  , isCallable = require('es5-ext/lib/Object/is-callable')
  , isPromise  = require('../../is-promise')
  , deferred   = require('../../deferred');

deferred.extend('match', function (win, fail) {
	var def;
	((win == null) || callable(win));
	if (!win && (fail == null)) {
		return this;
	}
	if (!this.pending) {
		this.pending = [];
	}
	def = deferred();
	this.pending.push('match', [win, fail, def.resolve]);
	return def.promise;
}, function (win, fail, resolve) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) {
		resolve(this);
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) {
				resolve(cb.value);
			} else {
				cb.end(resolve, resolve);
			}
			return;
		}
		if (!this.failed) {
			cb = match.call(cb);
		}
		try {
			value = cb(this.value);
		} catch (e) {
			value = e;
		}
		resolve(value);
	} else {
		resolve(cb);
	}
}, function (win, fail) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) {
		return this;
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		if (!this.failed) cb = match.call(cb);
		try {
			value = cb(this.value);
		} catch (e) {
			value = e;
		}
		return deferred(value);
	}
	return deferred(cb);
});
