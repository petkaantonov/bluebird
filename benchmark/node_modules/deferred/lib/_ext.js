'use strict';

var callable   = require('es5-ext/lib/Object/valid-callable')
  , d          = require('es5-ext/lib/Object/descriptor')
  , isCallable = require('es5-ext/lib/Object/is-callable')
  , ee         = require('event-emitter/lib/core')
  , isPromise  = require('./is-promise')

  , create = Object.create, defineProperty = Object.defineProperty, deferred
  , doneFn;

module.exports = exports = function (name, unres, onres, res) {
	name = String(name);
	(callable(res) && ((onres == null) || callable(onres)) && callable(unres));
	defineProperty(exports._unresolved, name, d(unres));
	exports._onresolve[name] = onres;
	defineProperty(exports._resolved, name, d(res));
	exports._names.push(name);
};

exports._names = ['end', 'then', 'valueOf'];

exports._unresolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var def;
		if (!this.pending) this.pending = [];
		def = deferred();
		this.pending.push('then', [win, fail, def.resolve]);
		return def.promise;
	}),
	done: d(doneFn = function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (!this.pending) this.pending = [];
		this.pending.push('done', arguments);
	}),
	end: d(doneFn),
	resolved: d(false),
	returnsPromise: d(true),
	valueOf: d(function () { return this; })
}));

exports._onresolve = {
	then: function (win, fail, resolve) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			resolve(this.value);
			return;
		}
		if (isCallable(cb)) {
			if (isPromise(cb)) {
				if (cb.resolved) {
					resolve(cb.value);
					return;
				}
				cb.end(resolve, resolve);
				return;
			}
			try { value = cb(this.value); } catch (e) { value = e; }
			resolve(value);
			return;
		}
		resolve(cb);
	},
	done: doneFn = function (win, fail) {
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	},
	end: doneFn
};

exports._resolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			return this;
		}
		if (isCallable(cb)) {
			if (isPromise(cb)) return cb;
			try { value = cb(this.value); } catch (e) { value = e; }
			return deferred(value);
		}
		return deferred(cb);
	}),
	done: d(doneFn = function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	}),
	end: d(doneFn),
	resolved: d(true),
	returnsPromise: d(true),
	valueOf: d(function () { return this.value; })
}));

deferred = require('./deferred');
deferred.extend = exports;
