'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t, a, d) {
	deferred([deferred(2), deferred(3), 4]).reduce(function (arg1, arg2) {
		return deferred(arg1 * arg2);
	}, deferred(1))(function (r) {
		a(r, 24);
	}, a.never).end(d, d);
};
