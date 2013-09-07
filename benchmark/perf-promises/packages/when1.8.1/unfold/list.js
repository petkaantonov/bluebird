/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(['when', 'unfold'], function(when, unfold) {

	/**
	 * Given a seed and generator, produces an Array.  Effectively the
	 * dual (opposite) of when.reduce()
	 * @param {function} generator function that generates a value (or promise
	 *  for a value) to be placed in the resulting array
	 * @param {function} condition given a seed, must return truthy if the unfold
	 *  should continue, or falsey if it should terminate
	 * @param {*|Promise} seed any value or promise
	 * @return {Promise} resulting array
	 */
	return function list(generator, condition, seed) {
		var result = [];

		return unfold(generator, condition, append, seed).yield(result);

		function append(value, newSeed) {
			result.push(value);
			return newSeed;
		}
	};

});
})(typeof define == 'function' && define.amd
	? define
	: function (deps, factory) { typeof exports == 'object'
		? (module.exports = factory(require('../when'), require('../unfold')))
		: (this.when_unfoldList = factory(this.when, this.when_unfold));
	}
	// Boilerplate for AMD, Node, and browser global
);

