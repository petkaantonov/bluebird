'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t, a) {
	var x = {}, d = deferred(), p = d.promise, invoked = false;

	a(p.finally(function (o) {
		a(o, undefined, "Unresolved: arguments");
		invoked = true;
	}), p, "Returns self promise");
	a(invoked, false, "Callback not invoked on unresolved promise");
	d.resolve(x);
	a(invoked, true, "Callback invoked immediately on resolution");

	invoked = false;
	p.finally(function (o) {
		a(o, undefined, "Resolved: arguments");
		invoked = true;
	});
	a(invoked, true, "Callback invoked immediately on resolved promise");

	p = deferred();
	p.promise.finally(function (o) {
		a(o, undefined, "Erronous unresolved: arguments");
		invoked = true;
	});
	invoked = false;
	p = p.reject(x = new Error("Error"));
	a(invoked, true, "Called on reject");
	invoked = false;
	p.finally(function (o) {
		a(o, undefined, "Erronous: arguments");
		invoked = true;
	});
	a(invoked, true, "Called on erronous");
};
