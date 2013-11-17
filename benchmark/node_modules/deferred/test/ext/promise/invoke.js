'use strict';

module.exports = function (t, a, d) {
	var x = {}, fn;
	fn = function (y, cb) {
		setTimeout(function () {
			if (cb) {
				cb(null, 3);
			}
		}, 0);
		return y;
	};
	t({}).invoke(fn, x)(function (r) {
		a(r, x);
	}).end(d, d);
};

var deferred = require('../../../lib/deferred');

module.exports = function () {
	return {
		"Function": function (a, d) {
			var x = {}, z = {};
			z.foo = function (y, cb) {
				var self = this;
				setTimeout(function () {
					if (cb) {
						cb(null, self, y);
					}
					d();
				}, 0);
				return 3;
			};
			deferred(z).invoke('foo', x)(function (r) {
				a(r, 3);
			}).end();
		},
		"Method": function (a, d) {
			var x = {}, fn, z = {};
			fn = function (y, cb) {
				var self = this;
				setTimeout(function () {
					if (cb) {
						cb(null, self, y);
					}
					d();
				}, 0);
				return 3;
			};
			deferred(z).invoke(fn, x)(function (r) {
				a(r, 3);
			}).end();
		},
		"Fail": function (a) {
			var e = new Error("Error");
			deferred(e).invoke('bla')(a.never, function (r) {
				a(r, e);
			}).end();
		},
		"Null input": function (a) {
			deferred(null).invoke('test')(a.never, function (e) {
				a.ok(e instanceof TypeError);
			}).end();
		},
		"No Function": function (a) {
			deferred({}).invoke('test')(a.never, function (e) {
				a.ok(e instanceof TypeError);
			}).end();
		},
		"Promise arguments": function (a) {
			var y = {}, z = {}, x = { foo: function (w, u) {
				a(this, x, "Context");
				a.deep([w, u], [y, z], "Arguments");
				return 'foo';
			} };
			deferred(x).invoke('foo', deferred(y), z)(function (r) {
				a(r, 'foo', "Result");
			}, a.never).end();
		},
		"Erroneous": function (a) {
			var x, fn;
			x = new Error('Test');
			fn = function () {
				return x;
			};
			deferred({}).invoke(fn)(a.never, function (e) {
				a(e, x);
			}).end();
		},
		"Function crash": function (a) {
			var x = new Error('Test'), fn;
			fn = function () {
				throw x;
			};
			deferred({}).invoke(fn)(a.never, function (e) {
				a(e, x);
			}).end();
		}
	};
};
