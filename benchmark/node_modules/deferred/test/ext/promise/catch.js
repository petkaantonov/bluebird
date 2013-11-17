'use strict';

var deferred  = require('../../../lib/deferred')
  , isPromise = require('../../../lib/is-promise');

module.exports = function (t, a) {
	var x = {}, y = {}, d = deferred(), p = d.promise, np, invoked = false, val;

	a.throws(function () { p.catch(); }, "Value is mandatory");
	a.not(np = p.catch(a.never), p, "Returns other promise");
	a(isPromise(np), true, "Returns promise");
	d.resolve(x);
	np.done(function (x) { val = x; });
	a(val, x, "Pass success");

	p = deferred(x = new Error("Error"));
	np = p.catch(function (o) {
		a(o, x, "Resolved: arguments");
		invoked = true;
		return y;
	});
	a(invoked, true, "Callback invoked immediately on resolved promise");

	np.done(function (x) { val = x; });
	a(val, y, "Resolves with returned value");
};
