'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t, a, d) {
	var count = 0;
	deferred([deferred(1), deferred(2), 3]).some(function (res) {
		++count;
		if (res > 1) {
			return true;
		}
	})(function (r) {
		a(r, true);
		a(count, 2, "Count");
	}).end(d, d);
};
