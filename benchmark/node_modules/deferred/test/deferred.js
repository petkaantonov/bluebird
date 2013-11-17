'use strict';

var isPromise = require('../lib/is-promise')

  , x = {};

module.exports = {
	"No arguments": function (t, a, d) {
		var defer = t();
		a(isPromise(defer.promise), true, "Promise");
		defer.resolve(x)(function (res) {
			a(res, x, "Resolve");
			d();
		});
	},
	"One argument": function (t, a, d) {
		var p = t(x);
		a(isPromise(p), true, "Got promise");
		p(function (res) {
			a(res, x, "Promise for passed value");
			d();
		});
	},
	"More than one argument": function (t) {
		var x = {}, y = {};
		return {
			"Success": function (a, d) {
				t(t(x), y, null)(function (r) {
					a.deep(r, [x, y, null]);
					d();
				}).end();
			},
			"Error": function (a, d) {
				var d1 = t(), v, res = false;
				setTimeout(d1.resolve, 20);
				t(t(x), d1.promise(function () {
					a(res, true, "Resolved");
					d();
				}), v = new Error("Error"), {})(a.never, function (e) {
					a(e, v);
					res = true;
				}).end();
			},
			"Resolve not via then": function (a) {
				var d = t();
				t(1, d.promise).end(function () {
					throw new Error("ERROR");
				});
				a.throws(d.resolve);
			}
		};
	},
	"Only first resolve is taken": function (t, a) {
		var defer = t();
		defer.promise.end();
		defer.resolve(1);
		defer.resolve(2);
		a(defer.promise.valueOf(), 1);
	},
	"Nested Promises": function (t, a) {
		var d1 = t(), d2 = t(), d3 = t(), d4 = t(), x = {};
		d1.resolve(d2.promise);
		d2.resolve(d3.promise);
		d3.resolve(d4.promise);
		d4.resolve(x);
		a(d1.promise.resolved, true, "#1 resolved");
		a(d2.promise.resolved, true, "#2 resolved");
		a(d3.promise.resolved, true, "#3 resolved");
		a(d4.promise.resolved, true, "#4 resolved");
		d1.promise(function (arg) {
			a(arg, x, "#1");
		}).end();
		d2.promise(function (arg) {
			a(arg, x, "#2");
		}).end();
		d3.promise(function (arg) {
			a(arg, x, "#3");
		}).end();
		d2.promise(function (arg) {
			a(arg, x, "#4");
		}).end();
	},
	"Transfer pending": function (t, a) {
		var d1 = t(), d2 = t(), x = {}, p;
		d1.resolve(d2.promise);
		p = d1.promise(function (arg) {
			return [arg, 'foo'];
		});
		d2.resolve(x);
		a(p.resolved, true, "Transfered");
		a.deep(p.value, [x, 'foo'], "Transfered value");
	},
	"Resolve corner case": function (t, a) {
		var d1 = t(), d2 = t(), d3 = t(), d4 = t(), count = 0;

		d1.promise(function () { ++count; });
		d2.promise(function () { ++count; });
		d3.promise(function () { ++count; });
		d4.promise(function () { ++count; });

		d1.resolve(d2.promise);
		d2.resolve(d3.promise);
		d3.resolve(d4.promise);
		d2.promise(function () { ++count; });
		d1.promise(function () { ++count; });
		d4.resolve({});
		a(count, 6);
	},
	"Call all then callbacks in order": function (t, a, d) {
		var def = t(), promise = def.promise, x = {}, count = 0;
		promise(function () {
			++count;
		}, a.never).end();
		promise(function () {
			a(count, 1);
		}, a.never).end(d, d);
		def.resolve(x);
	},
	"Resolve promise with other promise": function (t, a, d) {
		var def1 = t(), p1 = def1.promise, x = {}
		  , def2 = t(), p2 = def2.promise;
		p1(function (result) {
			a(result, x);
		}, a.never).end(d, d);
		def1.resolve(p2);
		def2.resolve(x);
	},
	"Reject": function (t, a) {
		var e = new Error("Error!");
		a.throws(function () {
			t.reject("Error!");
		}, "Throw on non error reject");
		t().reject(e).end(a.never, function (result) { a(result, e); });
	}
};
