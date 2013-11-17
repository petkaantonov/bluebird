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
	/*jshint maxcomplexity:7*/

	var array, warn, warnAll, log;

	array = require('../array');

	if(typeof console === 'undefined') {
		// No console, give up, but at least don't break
		log = consoleNotAvailable;
	} else {
		if (console.warn && console.dir) {
			// Sensible console found, use it
			warn = function (x) {
				console.warn(x);
			};
		} else {
			// IE8 has console.log and JSON, so we can make a
			// reasonably useful warn() from those.
			// Credit to webpro (https://github.com/webpro) for this idea
			if (console.log && typeof JSON != 'undefined') {
				warn = function (x) {
					console.log(typeof x === 'string' ? x : JSON.stringify(x));
				};
			}
		}

		if(!warn) {
			// Couldn't find a suitable console logging function
			// Give up and just be silent
			log = consoleNotAvailable;
		} else {
			if(console.groupCollapsed) {
				warnAll = function(msg, list) {
					console.groupCollapsed(msg);
					try {
						array.forEach(list, warn);
					} finally {
						console.groupEnd();
					}
				};
			} else {
				warnAll = function(msg, list) {
					warn(msg);
					warn(list);
				};
			}

			log = function(rejections) {
				if(rejections.length) {
					warnAll('[promises] Unhandled rejections: '
						+ rejections.length, rejections);
				} else {
					warn('[promises] All previously unhandled rejections have now been handled');
				}
			};
		}

	}

	return log;

	function consoleNotAvailable() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
