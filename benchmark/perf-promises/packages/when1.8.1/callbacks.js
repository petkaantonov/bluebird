/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * callbacks.js
 *
 * Collection of helper functions for interacting with 'traditional',
 * callback-taking functions using a promise interface.
 *
 * @author Renato Zannon <renato.riccieri@gmail.com>
 */

(function(define) {
define(['./when'], function(when) {
	var slice = [].slice;

	return {
		apply:     apply,
		call:      call,
		bind:      bind,
		promisify: promisify
	};

	/**
	* Takes a `traditional` callback-taking function and returns a promise for its
	* result, accepting an optional array of arguments (that might be values or
	* promises). It assumes that the function takes its callback and errback as
	* the last two arguments. The resolution of the promise depends on whether the
	* function will call its callback or its errback.
	*
	* @example
	*	var domIsLoaded = callbacks.apply($);
	*	domIsLoaded.then(function() {
	*		doMyDomStuff();
	*	});
	*
	* @example
	*	function existingAjaxyFunction(url, callback, errback) {
	*		// Complex logic you'd rather not change
	*	}
	*
	*	var promise = callbacks.apply(existingAjaxyFunction, ["/movies.json"]);
	*
	*	promise.then(function(movies) {
	*		// Work with movies
	*	}, function(reason) {
	*		// Handle error
	*	});
	*
	* @param {function} asyncFunction function to be called
	* @param {Array} [extraAsyncArgs] array of arguments to asyncFunction
	* @returns {Promise} promise for the callback value of asyncFunction
	*/

	function apply(asyncFunction, extraAsyncArgs) {
		return when.all(extraAsyncArgs || []).then(function(args) {
			var deferred = when.defer();

			var asyncArgs = args.concat(
				alwaysUnary(deferred.resolve),
				alwaysUnary(deferred.reject)
			);

			asyncFunction.apply(null, asyncArgs);

			return deferred.promise;
		});
	}

	/**
	* Works as `callbacks.apply` does, with the difference that the arguments to
	* the function are passed individually, instead of as an array.
	*
	* @example
	*	function sumInFiveSeconds(a, b, callback) {
	*		setTimeout(function() {
	*			callback(a + b);
	*		}, 5000);
	*	}
	*
	*	var sumPromise = callbacks.call(sumInFiveSeconds, 5, 10);
	*
	*	// Logs '15' 5 seconds later
	*	sumPromise.then(console.log);
	*
	* @param {function} asyncFunction function to be called
	* @param {...*} [args] arguments that will be forwarded to the function
	* @returns {Promise} promise for the callback value of asyncFunction
	*/

	function call(asyncFunction/*, arg1, arg2...*/) {
		var extraAsyncArgs = slice.call(arguments, 1);
		return apply(asyncFunction, extraAsyncArgs);
	}

	/**
	* Takes a 'traditional' callback/errback-taking function and returns a function
	* that returns a promise instead. The resolution/rejection of the promise
	* depends on whether the original function will call its callback or its
	* errback.
	*
	* If additional arguments are passed to the `bind` call, they will be prepended
	* on the calls to the original function, much like `Function.prototype.bind`.
	*
	* The resulting function is also "promise-aware", in the sense that, if given
	* promises as arguments, it will wait for their resolution before executing.
	*
	* @example
	*	function traditionalAjax(method, url, callback, errback) {
	*		var xhr = new XMLHttpRequest();
	*		xhr.open(method, url);
	*
	*		xhr.onload = callback;
	*		xhr.onerror = errback;
	*
	*		xhr.send();
	*	}
	*
	*	var promiseAjax = callbacks.bind(traditionalAjax);
	*	promiseAjax("GET", "/movies.json").then(console.log, console.error);
	*
	*	var promiseAjaxGet = callbacks.bind(traditionalAjax, "GET");
	*	promiseAjaxGet("/movies.json").then(console.log, console.error);
	*
	* @param {Function} asyncFunction traditional function to be decorated
	* @param {...*} [args] arguments to be prepended for the new function
	* @returns {Function} a promise-returning function
	*/
	function bind(asyncFunction/*, args...*/) {
		var leadingArgs = slice.call(arguments, 1);

		return function() {
			var trailingArgs = slice.call(arguments, 0);
			return apply(asyncFunction, leadingArgs.concat(trailingArgs));
		};
	}

	/**
	* `promisify` is a version of `bind` that allows fine-grained control over the
	* arguments that passed to the underlying function. It is intended to handle
	* functions that don't follow the common callback and errback positions.
	*
	* The control is done by passing an object whose 'callback' and/or 'errback'
	* keys, whose values are the corresponding 0-based indexes of the arguments on
	* the function. Negative values are interpreted as being relative to the end
	* of the arguments array.
	*
	* If arguments are given on the call to the 'promisified' function, they are
	* intermingled with the callback and errback. If a promise is given among them,
	* the execution of the function will only occur after its resolution.
	*
	* @example
	*	var delay = callbacks.promisify(setTimeout, {
	*		callback: 0
	*	});
	*
	*	delay(100).then(function() {
	*		console.log("This happens 100ms afterwards");
	*	});
	*
	* @example
	*	function callbackAsLast(errback, followsStandards, callback) {
	*		if(followsStandards) {
	*			callback("well done!");
	*		} else {
	*			errback("some programmers just want to watch the world burn");
	*		}
	*	}
	*
	*	var promisified = callbacks.promisify(callbackAsLast, {
	*		callback: -1,
	*		errback:   0,
	*	});
	*
	*	promisified(true).then(console.log, console.error);
	*	promisified(false).then(console.log, console.error);
	*
	*/
	function promisify(asyncFunction, positions) {
		return function() {
			var finalArgs = fillableArray();
			var deferred = when.defer();

			if('callback' in positions) {
				finalArgs.add(positions.callback, alwaysUnary(deferred.resolve));
			}

			if('errback' in positions) {
				finalArgs.add(positions.errback, alwaysUnary(deferred.reject));
			}

			return when.all(arguments).then(function(args) {
				finalArgs.fillHolesWith(args);
				asyncFunction.apply(null, finalArgs.toArray());

				return deferred.promise;
			});
		};
	}

	function fillableArray() {
		var beginningArgs = [], endArgs = [];

		return {
			add: function(index, value) {
				if(index >= 0) {
					beginningArgs[index] = value;
				} else {
					// Since we can't know how many arguments at the end there'll be
					// (there might be -1, -2, -3...), we fill the array containing them
					// in reverse order: from the element that will be the last argument
					// (-1), following to the penultimate (-2) etc.
					var offsetFromEnd = Math.abs(index) - 1;
					endArgs[offsetFromEnd] = value;
				}
			},

			fillHolesWith: function(arrayLike) {
				var i, j;

				for(i = 0, j = 0; i < arrayLike.length; i++, j++) {
					while(j in beginningArgs) { j++; }
					beginningArgs[j] = arrayLike[i];
				}
			},

			toArray: function() {
				var result = slice.call(beginningArgs, 0);

				// Now, the 'endArgs' array is supposedly finished, and we can traverse
				// it to get the elements that should be appended to the array. Since
				// the elements are in reversed order, we traverse it from back to
				// front.
				for(var i = endArgs.length - 1; i >= 0; i--) {
					result.push(endArgs[i]);
				}

				return result;
			}
		};
	}

	function alwaysUnary(fn) {
		return function() {
			if(arguments.length <= 1) {
				fn.apply(null, arguments);
			} else {
				fn.call(null, slice.call(arguments, 0));
			}
		};
	}
});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when_callback = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
