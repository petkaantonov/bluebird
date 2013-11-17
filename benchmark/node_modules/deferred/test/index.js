'use strict';

var isFunction = require('es5-ext/lib/Function/is-function')
  , convert    = require('es5-ext/lib/String/prototype/hyphen-to-camel')
  , path       = require('path')
  , readdir    = require('fs').readdir
  , indexTest  = require('tad/lib/utils/index-test')

  , dir = path.dirname(__dirname) + '/lib';

module.exports = {
	"": indexTest(indexTest.readDir(dir)(function (o) {
		delete o.deferred;
		delete o.ext;
		delete o.promise;
		delete o.profiler;
		return o;
	}), ['Deferred', 'delay', 'extend', 'gate', 'profile', 'profileEnd',
		'promisify', 'promisifySync', 'map', 'reduce', 'some']),
	"isPromise": function (t, a) {
		a(t.isPromise(t(null)), true);
		a(t.isPromise({}), false);
	},
	"Delay": function (t, a, d) {
		var x = {};
		t.delay(function (r) {
			return r;
		}, 5)(x)(function (r) {
			a(r, x);
		}).end(d, d);
	},
	"Gate": function (t, a) {
		var fn, dx, dy, ready;
		fn = t.gate(function (p) {
			return p;
		}, 1);
		dx = t();
		fn(dx.promise);
		dy = t();
		fn(dy.promise).end(function () {
			a(ready, true);
		});
		dy.resolve({});
		ready = true;
		dx.resolve({});
		ready = false;
	},
	"Profile": function (t, a) {
		a(typeof t.profile, 'function', "Profile");
		a(typeof t.profileEnd, 'function', "ProfileEnd");
	},
	"Promisify": function (t, a, d) {
		var x = {};
		t.promisify(function (cb) {
			setTimeout(function () {
				cb(null, x);
			}, 0);
			return {};
		})()(function (r) {
			a(r, x);
		}).end(d, d);
	},
	"PromisifySync": function (t, a, d) {
		t.promisifySync(function () {
			return;
		})()(function (r) {
			a(r, undefined);
		}).end(d, d);
	},
	"Map": function (t, a, d) {
		t.map([t(1), t(2), 3], function (res) {
			return t(res * res);
		})(function (r) {
			a.deep(r, [1, 4, 9]);
		}, a.never).end(d, d);
	},
	"Reduce": function (t, a, d) {
		t.reduce([t(1), t(2), 3], function (arg1, arg2) {
			return t(arg1 * arg2);
		}, 1)(function (r) {
			a(r, 6);
		}, a.never).end(d, d);
	},
	"Some": function (t, a, d) {
		var count = 0;
		t.some([t(1), t(2), 3], function (res, index) {
			++count;
			return index;
		})(function (r) {
			a(r, true);
			a(count, 2, "Count");
		}, a.never).end(d, d);
	},
	"Deferred function is main object": function (t, a) {
		var d = t();
		d.resolve({});
		a.ok(isFunction(d.resolve) && isFunction(d.promise.then));
	},
	"Ports are loaded": function (t, a, d) {
		var p = t().resolve();
		readdir(dir + '/ext/promise', function (err, files) {
			if (err) {
				d(err);
				return;
			}
			files.map(function (file) {
				if ((file.slice(-3) === '.js') && (file[0] !== '_')) {
					return convert.call(file.slice(0, -3));
				}
			}).filter(Boolean).forEach(function (file) {
				a(isFunction(p[file]), true, file);
			});
			d();
		});
	}
};
