// Limit number of concurrent function executions (to cLimit number).
// Limited calls are queued. Optionaly maximum queue length can also be
// controlled with qLimit value, any calls that would reach over that limit
// would be discarded (its promise would resolve with "Too many calls" error)

'use strict';

var toUint    = require('es5-ext/lib/Number/to-uint')
  , callable  = require('es5-ext/lib/Object/valid-callable')
  , eeUnify   = require('event-emitter/lib/unify')
  , deferred  = require('../../deferred')
  , isPromise = require('../../is-promise')

  , apply = Function.prototype.apply, max = Math.max

  , reject;

require('../promise/finally');

reject = function () {
	var e = new Error("Too many calls");
	e.type = 'deferred-gate-rejected';
	return deferred(e);
};

module.exports = function (cLimit, qLimit) {
	var fn, count, decrement, unload, queue, run, result;
	fn = callable(this);
	cLimit = max(toUint(cLimit), 1);
	qLimit = ((qLimit == null) || isNaN(qLimit)) ? Infinity : toUint(qLimit);
	count = 0;
	queue = [];

	run = function (thisArg, args, def) {
		var r;
		try {
			r = apply.call(fn, thisArg, args);
		} catch (e) {
			r = e;
		}
		if (isPromise(r)) {
			if (def) eeUnify(def.promise, r);
			if (!r.resolved) {
				++count;
				if (def) def.resolve(r);
				return r.finally(decrement);
			}
			r = r.value;
		}
		if (!def) return deferred(r);
		def.resolve(r);
		unload();
	};

	decrement = function () {
		--count;
		unload();
	};

	unload = function () {
		var data;
		if ((data = queue.shift())) run.apply(null, data);
	};

	result = function () {
		var def;
		if (count >= cLimit) {
			if (queue.length < qLimit) {
				def = deferred();
				queue.push([this, arguments, def]);
				return def.promise;
			}
			return reject();
		}
		return run(this, arguments);
	};
	result.returnsPromise = true;
	return result;
};
