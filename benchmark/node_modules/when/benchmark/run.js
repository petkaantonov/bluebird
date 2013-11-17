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

	var Benchmark, log, err;

	Benchmark = require('benchmark');
	log = console.log.bind(console);
	err = console.error.bind(console);

	//
	// Simple multi-benchmark runner
	//
	return function run(tests) {
		var skipped = [];

		tests.reduce(function (suite, test) {
			var skip = shouldSkip(test);
			if(skip) {
				skipped.push(pad(test.name, 24) + ' ' + skip);
				return suite;
			}

			test.onError = err;
			test.onComplete = function (event) {
				var result, t;

				t = event.currentTarget;

				result = pad(t.name, 24)
					+ pad(t.hz.toFixed(2) + ' op/s', 16)
					+ pad((1000 * t.stats.mean).toFixed(2), 8)
					+ ' ms/op \xb1 ' + t.stats.rme.toFixed(2) + '%';
				log(result);
			};

			return suite.add(test);

		}, new Benchmark.Suite())
			.on('start', function() {
				log('Platform:', Benchmark.platform.description || 'unknown');
				if(skipped.length) {
					log('------------------------------------------------');
					log('Skipping ' + count(skipped.length, 'benchmark'));
					log(skipped.join('\n'));
				}
				log('------------------------------------------------');
				log('Running ' + count(this.length, 'benchmark'));
			})
			.on('complete', function () {
				log('------------------------------------------------');
			}).run();

	};

	function shouldSkip(test) {
		return typeof test.condition === 'function'
			&& test.condition();
	}

	function pad(str, len) {
		var result = str;
		while (result.length < len) {
			result = ' ' + result;
		}
		return result;
	}

	function count(n, s) {
		return '' + n + ' ' + (n === 1 ? s : (s + 's'));
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
