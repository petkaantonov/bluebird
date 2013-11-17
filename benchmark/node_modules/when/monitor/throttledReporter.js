/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
	define(function() {
		/*global setTimeout*/

		/**
		 * Throttles the given reporter such that it will report
		 * at most once every ms milliseconds
		 * @param {number} ms minimum millis between reports
		 * @param {function} reporter reporter to be throttled
		 * @return {function} throttled version of reporter
		 */
		return function throttleReporter(ms, reporter) {
			var timeout, toReport;

			return function(promises) {
				toReport = promises;
				if(timeout == null) {
					timeout = setTimeout(function() {
						timeout = null;
						reporter(toReport);
					}, ms);
				}
			};
		};

	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
