'use strict';

var isPromise = require('../../lib/is-promise')
  , deferred  = require('../../lib/deferred');

module.exports = function (t) {
	var x = {}, y = {}, e = new Error();
	return {
		"Limit": function (a) {
			a.deep(t([x, 34, 'raz'], 2), [x, 34]);
		},
		"Extend": function (a) {
			a.deep(t([x, 34, 'raz'], 5), [x, 34, 'raz', undefined, undefined]);
		},
		"Promise arguments": {
			"Resolved": {
				"": function (a) {
					a.deep(t([x, deferred(y), 'dwa', deferred(null)]),
						[x, y, 'dwa', null]);
				},
				"Error": function (a) {
					var p = deferred(e);
					a(t([x, p, 'dwa', deferred(null)]), p);
				}
			},
			"Unresolved": {
				"": function (a) {
					var py = deferred(), px = deferred(), p;
					p = t([x, py.promise, 'dwa', px.promise]);
					a(isPromise(p), true, "Promise");
					p.end(function (args) {
						a.deep(args, [x, y, 'dwa', x]);
					}, a.never);
					py.resolve(y);
					px.resolve(x);
				},
				"Error": function (a) {
					var py = deferred(), px = deferred(), p;
					p = t([x, py.promise, 'dwa', px.promise]);
					a(isPromise(p), true, "Promise");
					p.end(a.never, function (err) {
						a(err, e);
					});
					py.resolve(y);
					px.resolve(e);
				}
			}
		}
	};
};
