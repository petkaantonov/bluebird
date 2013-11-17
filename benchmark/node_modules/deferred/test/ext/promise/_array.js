'use strict';

var isError  = require('es5-ext/lib/Error/is-error')
  , deferred = require('../../../lib/deferred');

module.exports = function (t) {
	t('map', require('../../../lib/ext/array/map'));

	return {
		"Direct": function (a) {
			deferred([deferred(1), deferred(2), 3]).map(function (res) {
				return deferred(res * res);
			})(function (r) {
				a.deep(r, [1, 4, 9]);
			}, a.never).end();
		},
		"Delayed": function (a) {
			var def = deferred();
			def.promise.map(function (res) {
				return deferred(res * res);
			})(function (r) {
				a.deep(r, [1, 4, 9]);
			}, a.never).end();
			def.resolve([deferred(1), deferred(2), 3]);
		},
		"Error": function (a) {
			t('reduce', require('../../../lib/ext/array/reduce'));
			deferred([]).reduce(function () {})(a.never, function (err) {
				a(isError(err), true, "Error");
			}).end();
		}
	};
};
