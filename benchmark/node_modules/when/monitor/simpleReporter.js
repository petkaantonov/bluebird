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

	/**
	 * Creates a simple promise monitor reporter that filters out all
	 * but unhandled rejections, formats them using the supplied
	 * formatter, and then sends the results to the supplied log
	 * functions
	 * @param {function} format formats a single promise monitor
	 *  record for output
	 * @param {function} log logging function to which all unhandled
	 *  rejections will be passed.
	 * @return reporter functions
	 */
	return function simpleReporter(format, log) {
		var len = 0;

		return function(promises) {
			promises = filterAndFormat(format, promises);

			if (len === 0 && promises.length === 0) {
				return;
			}

			try {
				log(promises);
			} finally {
				len = promises.length;
			}
		};
	};

	function filterAndFormat(format, promises) {
		var key, rec, rejected;

		rejected = [];

		for(key in promises) {
			rec = promises[key];
			if(rec.rejectedAt) {
				rejected.push(format(rec));
			}
		}

		return rejected;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
