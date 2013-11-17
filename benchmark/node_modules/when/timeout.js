/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * timeout.js
 *
 * Helper that returns a promise that rejects after a specified timeout,
 * if not explicitly resolved or rejected before that.
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) {
define(function(require) {
	/*global setTimeout,clearTimeout*/
    var when, setTimer, cancelTimer, cjsRequire, vertx;

	when = require('./when');
	cjsRequire = require;

	try {
		vertx = cjsRequire('vertx');
		setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
		cancelTimer = vertx.cancelTimer;
	} catch (e) {
		setTimer = setTimeout;
		cancelTimer = clearTimeout;
	}

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied trigger doesn't resolve or reject before that.
     *
	 * @param {number} msec timeout in milliseconds
     * @param {*|Promise} trigger any promise or value that should trigger the
	 *  returned promise to resolve or reject before the msec timeout
     * @returns {Promise} promise that will timeout after msec, or be
	 *  equivalent to trigger if resolved/rejected before msec
     */
    return function timeout(msec, trigger) {
		// Support reversed, deprecated argument ordering
		if(typeof trigger === 'number') {
			var tmp = trigger;
			trigger = msec;
			msec = tmp;
		}

		return when.promise(function(resolve, reject, notify) {

			var timeoutRef = setTimer(function onTimeout() {
				reject(new Error('timed out after ' + msec + 'ms'));
			}, msec);

			when(trigger,
				function onFulfill(value) {
					cancelTimer(timeoutRef);
					resolve(value);
				},
				function onReject(reason) {
					cancelTimer(timeoutRef);
					reject(reason);
				},
				notify
			);
		});
    };
});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });


