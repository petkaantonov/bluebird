'use strict';

var keys     = Object.keys
  , deferred = require('../lib/deferred');

module.exports = function (t, a) {
	var d1, d2, data;
	deferred(1);

	t.profile();
	deferred(2);
	deferred({});
	deferred('raz');
	d1 = deferred();
	d2 = deferred();
	d1.resolve(1);
	d2.resolve(1);
	data = t.profileEnd();

	a(data.resolved.count, 3, "Resolved Count");
	a(data.unresolved.count, 2, "Unresolved Count");
	a(keys(data.resolved.stats).length, 1, "Resolved Stats");
	a(keys(data.unresolved.stats).length, 1, "Unresolved Stats");
};
