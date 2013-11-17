'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t, a, d) {
	deferred([deferred(1), deferred(2), 3]).map(function (res) {
		return deferred(res * res);
	})(function (r) {
		a.deep(r, [1, 4, 9]);
	}, a.never).end(d, d);
};
