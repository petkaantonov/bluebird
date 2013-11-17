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

	// Silly Array helpers, since when.js needs to be
	// backward compatible to ES3

	return {
		forEach: forEach,
		reduce: reduce
	};

	function forEach(array, f) {
		if(typeof array.forEach === 'function') {
			return array.forEach(f);
		}

		var i, len;

		i = -1;
		len = array.length;

		while(++i < len) {
			f(array[i], i, array);
		}
	}

	function reduce(array, initial, f) {
		if(typeof array.reduce === 'function') {
			return array.reduce(f, initial);
		}

		var i, len, result;

		i = -1;
		len = array.length;
		result = initial;

		while(++i < len) {
			result = f(result, array[i], i, array);
		}

		return result;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
