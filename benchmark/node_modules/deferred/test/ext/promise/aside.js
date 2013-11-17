'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t, a) {
	var x = {}, d = deferred(), p = d.promise, invoked = false;

	a(p.aside(), p, "Callback is optional");
	a(p.aside(function (o) {
		a(o, x, "Unresolved: arguments");
		invoked = true;
	}, a.never), p, "Returns self promise");
	a(invoked, false, "Callback not invoked on unresolved promise");
	d.resolve(x);
	a(invoked, true, "Callback invoked immediately on resolution");

	invoked = false;
	p.aside(function (o) {
		a(o, x, "Resolved: arguments");
		invoked = true;
	}, a.never);
	a(invoked, true, "Callback invoked immediately on resolved promise");

	p = deferred(x = new Error("Error"));
	invoked = false;
	p.aside(a.never, function (err) {
		a(err, x, "Erronous: arguments");
		invoked = true;
	});
	a(invoked, true, "Called on erronous");
	p.aside(a.never, null);

	p = deferred(x = {});
	p.aside(null, a.never);
};
