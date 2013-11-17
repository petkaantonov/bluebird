'use strict';

// Benchmark comparing overhead introduced by promise implementations
// (one by after another)
// To run it, do following in package path:
//
// $ npm install Q when kew bluebird
// $ node benchmark/one-after-another.js

var forEach    = require('es5-ext/lib/Object/for-each')
  , pad        = require('es5-ext/lib/String/prototype/pad')
  , lstat      = require('fs').lstat
  , Q          = require('Q')
  , Bluebird   = require('bluebird')
  , kew        = require('kew')
  , when       = require('when')
  , deferred   = require('../lib')

  , now = Date.now
  , Deferred = deferred.Deferred, promisify = deferred.promisify
  , nextTick = process.nextTick

  , self, time, count = 10000, data = {}, next, tests, def = deferred();

console.log("Promise overhead (calling one after another)",
	"x" + count + ":\n");

// Base
tests = [function () {
	var i = count;
	self = function () {
		lstat(__filename, function (err, stats) {
			if (err) throw err;
			if (--i) self(stats);
			else next(); // Ignore first one
		});
	};
	time = now();
	self();
}, function () {
	var i = count;
	self = function () {
		lstat(__filename, function (err, stats) {
			if (err) throw err;
			if (--i) {
				self(stats);
			} else {
				data["Base (plain Node.js lstat call)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	self();

// Bluebird
}, function () {
	var i = count, dlstat = Bluebird.promisify(lstat);

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) self(stats);
			else next();
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat = Bluebird.promisify(lstat);

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Bluebird: Promisify (generic wrapper)"] = now() - time;
				// Get out of try/catch clause
				next();
			}
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		return new Bluebird(function (resolve, reject) {
			lstat(path, function (err, stats) {
				if (err) reject(err);
				else resolve(stats);
			});
		});
	};

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) self(stats);
			else next();
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		return new Bluebird(function (resolve, reject) {
			lstat(path, function (err, stats) {
				if (err) reject(err);
				else resolve(stats);
			});
		});
	};

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Bluebird: Dedicated wrapper"] = now() - time;
				// Get out of try/catch clause
				next();
			}
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();

// Kew
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = kew.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def;
	};

	self = function () {
		dlstat(__filename).then(function (stats) {
			if (--i) self(stats);
			else nextTick(next);
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = kew.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def;
	};

	self = function () {
		dlstat(__filename).then(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Kew: Dedicated wrapper"] = now() - time;
				// Get out of try/catch clause
				nextTick(next);
			}
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	self();

// Deferred
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = new Deferred();
		lstat(path, function (err, stats) { def.resolve(err || stats); });
		return def.promise;
	};

	self = function () {
		dlstat(__filename).end(function (stats) {
			if (--i) self(stats);
			else next(); // Ignore first one
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = new Deferred();
		lstat(path, function (err, stats) { def.resolve(err || stats); });
		return def.promise;
	};

	self = function () {
		dlstat(__filename).end(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Deferred: Dedicated wrapper"] = now() - time;
				next();
			}
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat = promisify(lstat);

	self = function () {
		dlstat(__filename).end(function (stats) {
			if (--i) self(stats);
			else next(); // Ignore first one
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat = promisify(lstat);

	self = function () {
		dlstat(__filename).end(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Deferred: Promisify (generic wrapper)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	self();

// Q
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = Q.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) self(stats);
			else next();
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = Q.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Q: Dedicated wrapper"] = now() - time;
				// Get out of try/catch clause
				next();
			}
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat = Q.nbind(lstat, null);

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) self(stats);
			else next();
		});
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat = Q.nbind(lstat, null);

	self = function () {
		dlstat(__filename).done(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["Q: nbind (generic wrapper)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	self();

// When
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = when.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).then(function (stats) {
			if (--i) self(stats);
			else nextTick(next);
		}, function (e) { nextTick(function () { throw e; }); });
	};
	time = now();
	self();
}, function () {
	var i = count, dlstat;

	dlstat = function (path) {
		var def = when.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).then(function (stats) {
			if (--i) {
				self(stats);
			} else {
				data["When: Dedicated wrapper"] = now() - time;
				nextTick(next);
			}
		}, function (e) { nextTick(function () { throw e; }); });
	};
	time = now();
	self();
}];

next = function () {
	setTimeout(function () {
		if (tests.length) {
			tests.shift()();
		} else {
			def.resolve();
			forEach(data, function (value, name, obj, index) {
				console.log(pad.call(index + 1 + ":", " ", 3),
					pad.call(value, " ", 5) + "ms ", name);
			}, null, function (a, b) { return this[a] - this[b]; });
		}
	}, 100);
};

next();
