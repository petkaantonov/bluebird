'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function () {
	return {
		"Unresolved": function (a, d) {
			var x = {}, def = deferred(), p = def.promise, invoked = false;

			a(p.cb(), p, "Callback is optional");
			a(p.cb(function (err, o) {
				a.deep([err, o], [null, x], "Unresolved: arguments");
				invoked = true;
			}), p, "Returns self promise");
			a(invoked, false, "Callback not invoked on unresolved promise");
			invoked = false;
			def.resolve(x);
			a(invoked, false, "Callback not invoked in current tick");

			invoked = false;
			p.cb(function (err, o) {
				a.deep([err, o], [null, x], "Resolved: arguments");
				invoked = true;
				d();
			});
			a(invoked, false,
				"Callback not invoked immediatelly on resolved promise");
		},
		"Errorneus": function (a, d) {
			var x = new Error("Error")
			  , p = deferred(x)
			  , invoked = false;

			invoked = false;
			p.cb(function (err, o) {
				a.deep([err, o], [x, undefined], "Erronous: arguments");
				invoked = true;
				d();
			});
			a(invoked, false, "Called not invoked immediately");
		}
	};
};
