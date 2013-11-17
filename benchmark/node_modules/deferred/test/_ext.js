'use strict';

var deferred = require('../lib/deferred')

  , x = {}, y = {}, e = new Error("Error");

module.exports = {
	"Then callback run in current tick": function (a) {
		var next = false;
		deferred(null)(function () {
			a(next, false);
		}, a.never).end();
		next = true;
	},
	"Reject": function (a, d) {
		deferred(e)(a.never, function (res) {
			a(res, e);
		}).end(d, d);
	},
	"Erroneous callback rejects promise": function (a, d) {
		deferred(1)(function () {
			throw e;
		})(a.never, function (res) {
			a(res, e);
		}).end(d, d);
	},
	"Object promise resolves to same object": function (a, d) {
		deferred(x)(function (result) {
			a(result, x);
		}, a.never).end(d, d);
	},
	"Promise returns promise": function (a) {
		var p = deferred({});
		a(deferred(p), p);
	},
	"ValueOf": function (a) {
		var def = deferred(), y = def.promise;
		a(y.valueOf(), y, "Unresolved");
		def.resolve(x);
		a(y.valueOf(), x, "Resolved");
	},
	"Then": {
		"Callback": function (a, d) {
			deferred(x)(function (result) {
				a(result, x);
			}, a.never).end(d, d);
		},
		"Null": function (a, d) {
			deferred(x)(null, a.never)(function (result) {
				a(result, x);
			}, a.never).end(d, d);
		},
		"Other value": function (a, d) {
			deferred(x)(y, a.never)(function (result) {
				a(result, y);
			}, a.never).end(d, d);
		},
		"Error": function (a, d) {
			deferred(e)(a.never, function (result) {
				a(result, e);
			}).end(d, d);
		},
		"Chain promise & resolve with function": function (a) {
			var d1, fn, p1;
			d1 = deferred();
			fn = function () { return 'bar'; };
			d1.promise(deferred('foo')).end(function (res) {
				a(res, 'foo', "Unresolved");
			});
			d1.resolve(fn);
			p1 = deferred(2);
			a(deferred(1)(p1), p1, "Resolved");
		}
	},
	"Done": {
		"No args": {
			"Success": function (a) {
				a(deferred(null).done(), undefined);
			},
			"Error": function (a) {
				a.throws(function () {
					deferred(e).done();
				});
			}
		},
		"Args": {
			"Success": function (a) {
				deferred(x).done(function (res) {
					a(res, x, "Result");
				}, a.never);
			},
			"Error": function (a) {
				deferred(e).done(a.never, function (err) {
					a(err, e, "Error");
				});
			},
			"Success #2": function (a) {
				deferred(x).done(function (res) {
					a(res, x, "Result");
				}, null);
			},
			"Error: Throw": function (a) {
				a.throws(function () {
					deferred(e).done(a.never, null);
				});
			}
		}
	},
	"End": {
		"No args": {
			"Success": function (a) {
				a(deferred(null).end(), undefined);
			},
			"Error": function (a) {
				a.throws(function () {
					deferred(e).end();
				});
			}
		},
		"Args": {
			"Success": function (a) {
				deferred(x).end(function (res) {
					a(res, x, "Result");
				}, a.never);
			},
			"Error": function (a) {
				deferred(e).end(a.never, function (err) {
					a(err, e, "Error");
				});
			},
			"Success #2": function (a) {
				deferred(x).end(function (res) {
					a(res, x, "Result");
				}, null);
			},
			"Error: Throw": function (a) {
				a.throws(function () {
					deferred(e).end(a.never, null);
				});
			}
		}
	}
};
