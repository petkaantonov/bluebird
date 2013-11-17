'use strict';

var deferred = require('../lib/deferred');

module.exports = function (t, a) {
	var def = deferred();
	a(t(def.promise), def.promise, "Unresolved");
	def.resolve(true);
	a(t(def.promise), def.promise, "Resolved");
	a.throws(function () {
		t(function () {});
	}, "Function");
	a.throws(function () {
		t({});
	}, "Object");
};
