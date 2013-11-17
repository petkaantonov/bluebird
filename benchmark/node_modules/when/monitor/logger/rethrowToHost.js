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
	/*global setTimeout*/

	var array = require('../array');

	var rethrow = {
		RangeError: 1,
		ReferenceError: 1,
		SyntaxError: 1,
		TypeError: 1
	};

	/**
	 * Logger that will rethrow a specific set of exceptions
	 * in an uncatchable way so they always propagate to the host
	 * env.
	 * @param {object?} exceptionsToRethrow hash of exception types
	 *  to always rethrow to the host.
	 */
	return function(exceptionsToRethrow) {
		exceptionsToRethrow || (exceptionsToRethrow = rethrow);
		return function(rejections) {
			array.forEach(rejections, function(r) {
				if(r.reason && exceptionsToRethrow[r.reason.name]) {
					throwUncatchable(r.reason);
				}
			});
		};
	};

	function throwUncatchable(x) {
		setTimeout(function() {
			throw x;
		}, 0);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
