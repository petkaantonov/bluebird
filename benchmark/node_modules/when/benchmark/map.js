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

	var when, tests, run;

	when = require('../when');
	run = require('./run');

	tests = [
		{ name: 'map 100', fn: map(100), defer: true },
		{ name: 'map 1k', fn: map(1e3), defer: true }
	];

	run(tests);

	//
	// Benchmark tests
	//

	function map(n) {
		return function(deferred) {

			var input = [];
			for(var i = 0; i < n; i++) {
				input.push(when(i));
			}

			when.map(input, addOne).then(function() {
				deferred.resolve();
			});

		};
	}

	//
	// Promise helpers
	//

	function addOne(x) {
		return x + 1;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
