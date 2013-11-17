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

	var array = require('./array');

	return function(isExcluded, replace) {
		return function filterStack(stack) {
			var excluded;

			if(!(stack && stack.length)) {
				return [];
			}

			excluded = [];

			return array.reduce(stack, [], function(filtered, line) {
				var match;

				match = isExcluded(line);
				if(match) {
					if(!excluded) {
						excluded = [];
					}
					excluded.push(line);
				} else {
					if(excluded) {
						if(filtered.length > 1) {
							filtered = filtered.concat(replace(excluded));
							excluded = null;
						}
					}
					filtered.push(line);
				}

				return filtered;
			});
		};
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
