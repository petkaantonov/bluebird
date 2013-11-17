/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * delay.js
 *
 * Helper that returns a promise that resolves after a delay.
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) {
define(function(require) {
	/*global setTimeout*/
	var when, setTimer, cjsRequire, vertxSetTimer;

	when = require('./when');
	cjsRequire = require;

	try {
		vertxSetTimer = cjsRequire('vertx').setTimer;
		setTimer = function (f, ms) { return vertxSetTimer(ms, f); };
	} catch(e) {
		setTimer = setTimeout;
	}

    /**
     * Creates a new promise that will resolve after a msec delay.  If
	 * value is supplied, the delay will start *after* the supplied
	 * value is resolved.
     *
	 * @param {number} msec delay in milliseconds
     * @param {*|Promise?} value any promise or value after which
	 *  the delay will start
	 * @returns {Promise} promise that is equivalent to value, only delayed
	 *  by msec
     */
    return function delay(msec, value) {
		// Support reversed, deprecated argument ordering
		if(typeof value === 'number') {
			var tmp = value;
			value = msec;
			msec = tmp;
		}

		return when.promise(function(resolve, reject, notify) {
			when(value, function(val) {
				setTimer(function() {
					resolve(val);
				}, msec);
			},
			reject, notify);
		});
    };

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });


