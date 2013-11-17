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
	 * Function that forwards its arg to 2 other functions
	 * @param {function} f1 first function to which to forward
	 * @param {function} f2 second function to which to forward
	 * @return {function}
	 */
	return function(f1, f2) {
		return function(x) {
			f1(x);
			f2(x);
		};
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
