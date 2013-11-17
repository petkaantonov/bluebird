'use strict';

var deferred = require('../../../lib/deferred');

module.exports = {
	"Deferred": function (a) {
		var defer = deferred(), w = {}, x = {}, y = {}, z = [x, y, w]
		  , invoked = false;
		defer.resolve(z).match(function (m, n, o) {
			invoked = true;
			a(m, x, "#1");
			a(n, y, "#2");
			a(o, w, "#3");
		}).end();
		a(invoked, true, "Resolve in current tick");
	},
	"Promise": function (a, d) {
		var w = {}, x = {}, y = {}, z = [x, y, w];
		deferred(z).match(function (m, n, o) {
			a(m, x, "#1");
			a(n, y, "#2");
			a(o, w, "#3");
		}).end(d, d);
	},
	"Error": function (a, d) {
		var e = new Error('E!');
		deferred(e).match(a.never, function (err) {
			a(err, e);
		}).end(d, d);
	}
};
