// Run if you want to monitor unresolved promises (in properly working
// application there should be no promises that are never resolved)

'use strict';

var max        = Math.max
  , callable   = require('es5-ext/lib/Object/valid-callable')
  , isCallable = require('es5-ext/lib/Object/is-callable')
  , toUint     = require('es5-ext/lib/Number/to-uint')
  , deferred   = require('./deferred');

exports = module.exports = function (timeout, cb) {
	if (timeout === false) {
		// Cancel monitor
		delete deferred._monitor;
		delete exports.timeout;
		delete exports.callback;
		return;
	}
	exports.timeout = timeout = max(toUint(timeout) || 5000, 50);
	if (cb == null) {
		if ((typeof console !== 'undefined') && console &&
				isCallable(console.error)) {
			cb = function (e) {
				console.error(((e.stack && e.stack.toString()) ||
					"Unresolved promise: no stack available"));
			};
		}
	} else {
		callable(cb);
	}
	exports.callback = cb;

	deferred._monitor = function () {
		var e = new Error("Unresolved promise");
		return setTimeout(function () {
			if (cb) cb(e);
		}, timeout);
	};
};
