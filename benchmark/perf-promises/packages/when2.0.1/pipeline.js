/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * pipeline.js
 *
 * Run a set of task functions in sequence, passing the result
 * of the previous as an argument to the next.  Like a shell
 * pipeline, e.g. `cat file.txt | grep 'foo' | sed -e 's/foo/bar/g'
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(function(require) {

	var when;

	when = require('./when');

	/**
	 * Run array of tasks in a pipeline where the next
	 * tasks receives the result of the previous.  The first task
	 * will receive the initialArgs as its argument list.
	 * @param tasks {Array|Promise} array or promise for array of task functions
	 * @param [initialArgs...] {*} arguments to be passed to the first task
	 * @return {Promise} promise for return value of the final task
	 */
	return function pipeline(tasks /* initialArgs... */) {
		var initialArgs, runTask;

		initialArgs = Array.prototype.slice.call(arguments, 1);

		// Self-optimizing function to run first task with multiple
		// args using apply, but subsequence tasks via direct invocation
		runTask = function(task, args) {
			runTask = function(task, arg) {
				return task(arg);
			};

			return task.apply(null, args);
		};

		return when.reduce(tasks,
			function(args, task) {
				return runTask(task, args);
			},
			initialArgs
		);
	};

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


