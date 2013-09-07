/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * sequence.js
 *
 * Run a set of task functions in sequence.  All tasks will
 * receive the same args.
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(function(require) {

	var when;

	when = require('./when');

	/**
	 * Run array of tasks in sequence with no overlap
	 * @param tasks {Array|Promise} array or promiseForArray of task functions
	 * @param [args] {*} arguments to be passed to all tasks
	 * @return {Promise} promise for an array containing
	 * the result of each task in the array position corresponding
	 * to position of the task in the tasks array
	 */
	return function sequence(tasks /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		return when.reduce(tasks, function(results, task) {
			return when(task.apply(null, args), function(result) {
				results.push(result);
				return results;
			});
		}, []);
	};

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


