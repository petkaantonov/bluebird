'use strict';

var deferred = require('../lib/deferred');

module.exports = function (t, a, d) {
	var invoked, df, cachet, cachec;
	cachet = t.timeout;
	cachec = t.callback;
	t(100, function (stack) {
		a.ok(stack instanceof Error);
		invoked = true;
	});
	df = deferred();
	setTimeout(function () {
		a(invoked, true, "Invoked");
		t(cachet == null ? false : cachet, cachec);
		df.resolve();
		d();
	}, 150);
};
