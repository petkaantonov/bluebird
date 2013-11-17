/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function(require) {
	/*global setImmediate,process*/

	var when, tests, run, ok;

	when = require('../when');
	run = require('./run');
	ok = 0;

	tests = [
		{ name: 'create pending',     fn: createPending },
		{ name: 'resolve promise',    fn: resolvePromise, defer: true },
		{ name: 'setImmediate',       fn: viaSetImmediate, defer: true,
			condition: checkSetImmediate },
		{ name: 'process.nextTick',   fn: viaProcessNextTick, defer: true,
			condition: checkProcessNextTick },
		{ name: 'setTimeout',         fn: viaSetTimeout, defer: true },
		{ name: 'reject promise',     fn: rejectPromise, defer: true },
		{ name: 'reject then resolve', fn: rejectThenResolve, defer: true },
		{ name: 'resolve chain 100',  fn: resolveChain(100), defer: true },
		{ name: 'resolve chain 1k', fn: resolveChain(1e3), defer: true },
		{ name: 'sparse resolve chain 1k', fn: resolveChainSparse(1e3), defer: true },
		{ name: 'reject chain 100',  fn: rejectChain(100), defer: true },
		{ name: 'reject chain 1k', fn: rejectChain(1e3), defer: true },
		{ name: 'sparse reject chain 1k', fn: rejectChainSparse(1e3), defer: true },
		// These 10k tests seem to cause significant garbage collection
		// hits that skew results of other tests.  So, they are disabled
		// for now, but we need to figure out how to reduce the memory
		// thrashing these cause.
		// Leaving one enabled for now.
		{ name: 'resolve chain 10k', fn: resolveChain(1e4), defer: true }
//		{ name: 'sparse resolve chain 10k', fn: resolveChainSparse(1e4), defer: true },
//		{ name: 'reject chain 10k', fn: rejectChain(1e4), defer: true },
//		{ name: 'sparse reject chain 10k', fn: rejectChainSparse(1e4), defer: true }
	];

	run(tests);

	//
	// Benchmark tests
	//

	function createPending() {
		when.promise(pendingForever);
	}

	function resolvePromise(deferred) {
		when.promise(resolve).then(function() {
			deferred.resolve();
		});
	}

	function rejectPromise(deferred) {
		when.promise(reject).then(null, function() {
			deferred.resolve();
		});
	}

	function rejectThenResolve(deferred) {
		when.promise(reject).then(null, identity).then(function() {
			deferred.resolve();
		});
	}

	function viaSetTimeout(deferred) {
		setTimeout(function() {
			deferred.resolve();
		}, 0);
	}

	function viaSetImmediate(deferred) {
		setImmediate(function() {
			deferred.resolve();
		});
	}

	function viaProcessNextTick(deferred) {
		process.nextTick(function() {
			deferred.resolve();
		});
	}

	function resolveChain(n) {
		return function(deferred) {
			var p = when.resolve({}), i = 0;
			for(;i < n; i++) {
				p = p.then(identity);
			}

			p.then(function() {
				deferred.resolve();
			});
		};
	}

	function resolveChainSparse(n) {
		return function(deferred) {
			var p = when.resolve({}), i = 1;
			for(;i < n; i++) {
				p = p.then(null);
			}

			p.then(identity).then(function() {
				deferred.resolve();
			});
		};
	}

	function rejectChain(n) {
		return function(deferred) {
			var p = when.reject({}), i = 0;
			for(;i < n; i++) {
				p = p.then(null, rethrow);
			}

			p.then(null, function() {
				deferred.resolve();
			});
		};
	}

	function rejectChainSparse(n) {
		return function(deferred) {
			var p = when.reject({}), i = 1;
			for(;i < n; i++) {
				p = p.then(null, rethrow);
			}

			p.then(null, identity).then(function() {
				deferred.resolve();
			});
		};
	}

	//
	// Promise helpers
	//

	function pendingForever() {}

	function resolve(r) {
		r();
	}

	function reject(_, r) {
		r();
	}

	function identity(x) {
		return x;
	}

	function rethrow(e) {
		throw e;
	}

	function checkSetImmediate() {
		return typeof setImmediate === 'function'
			? ok : 'setImmediate() not available';
	}

	function checkProcessNextTick() {
		return typeof process !== 'undefined'
			&& typeof process.nextTick === 'function'
			? ok : 'process.nextTick() not available';
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
