'use strict';

var deferred = require('../../../lib/deferred');

module.exports = function (t) {
	var u = {}, x = {}, y = {}, z = {};
	return {
		"Promise arguments": function (a, d) {
			t.call(function (arg1, arg2, callback) {
				a(this, u, "Context");
				a.deep([arg1, arg2], [x, y], "Arguments");
				setTimeout(function () {
					callback(null, z);
				}, 0);
			}, 2).call(u, x, deferred(y), z)(function (result) {
				a(result, z);
			}, a.never).end(d, d);
		},
		"Normal arguments": function (a, d) {
			t.call(function (arg1, arg2, callback) {
				a(this, u, "Context");
				a.deep([arg1, arg2], [x, undefined], "Arguments");
				setTimeout(function () {
					callback(null, z);
				}, 0);
			}, 2).call(u, x)(function (result) {
				a(result, z);
			}, a.never).end(d, d);
		},
		"Do not promisify promisified function": function (a) {
			var fn, fn1;
			fn = t.call(function () { });
			fn1 = t.call(fn);
			a(fn, fn1);
		},
		"Successful": function (a, d) {
			var x = {}, y = {}, z = {};
			t.call(function (arg1, arg2, callback) {
				a.deep([arg1, arg2], [x, y], "Arguments");
				setTimeout(function () {
					callback(null, z);
				}, 0);
			})(x, y)(function (result) {
				a(result, z, "Result");
			}, a.never).end(d, d);
		},
		"Successful: Many args": function (a, d) {
			var x = {}, y = {}, z = {};
			t.call(function (arg1, arg2, callback) {
				a.deep([arg1, arg2], [x, y], "Arguments");
				setTimeout(function () {
					callback(null, x, y, z);
				}, 0);
			})(x, y)(function (result) {
				a.deep(result, [x, y, z], "Result");
			}, a.never).end(d, d);
		},
		"Erroneous": function (a, d) {
			var x = new Error('Test');
			t.call(function (callback) {
				setTimeout(function () {
					callback(x);
				}, 0);
			}, 0)(y)(a.never, function (e) {
				a(e, x);
			}).end(d, d);
		},
		"Function crash": function (a) {
			var x = new Error('Test'), fn;
			fn = t.call(function () {
				throw x;
			});
			a.throws(function () {
				fn();
			});
		},
		"True/False": function (a, d) {
			t.call(function (callback) {
				setTimeout(function () {
					callback(false);
				}, 0);
			})()(function (result) {
				a(result, false);
			}, a.never).end(d, d);
		}
	};
};
