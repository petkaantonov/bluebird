'use strict';

// Benchmark comparing performance of promise setups (concurrent)
// To run it, do following in package path:
//
// $ npm install Q when kew bluebird
// $ node benchmark/concurrent.js

var generate   = require('es5-ext/lib/Array/generate')
  , forEach    = require('es5-ext/lib/Object/for-each')
  , pad        = require('es5-ext/lib/String/prototype/pad')
  , lstat      = require('fs').lstat
  , Q          = require('Q')
  , Bluebird   = require('bluebird')
  , kew        = require('kew')
  , when       = require('when')
  , deferred   = require('../lib')

  , now = Date.now
  , Deferred = deferred.Deferred
  , promisify = deferred.promisify
  , nextTick  = process.nextTick

  , self, time, count = 10000, data = {}, next, tests, def = deferred()
  , files = generate(count, __filename);

console.log("Promise overhead (concurrent calls)", "x" + count + ":\n");

// Plain
tests = [function () {
	var i = count, j = count;
	self = function () {
		lstat(__filename, function (err, stats) {
			if (err) throw err;
			if (!--i) next(); // Ignore first
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count;
	self = function () {
		lstat(__filename, function (err, stats) {
			if (err) throw err;
			if (!--i) {
				data["Base (plain Node.js lstat call)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();

// Bluebird
}, function () {
	var i = count, j = count, dlstat = Bluebird.promisify(lstat);

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) next(); // Ignore first
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat = Bluebird.promisify(lstat);

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) {
				data["Bluebird: Promisify (generic wrapper)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		return new Bluebird(function (resolve, reject) {
			lstat(path, function (err, stats) {
				if (err) reject(err);
				else resolve(stats);
			});
		});
	};

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) next(); // Ignore first
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		return new Bluebird(function (resolve, reject) {
			lstat(path, function (err, stats) {
				if (err) reject(err);
				else resolve(stats);
			});
		});
	};

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) {
				data["Bluebird: Dedicated wrapper"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();

// Kew
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = kew.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) nextTick(next); // Ignore first
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = kew.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) {
				data["Kew: Dedicated wrapper"] = now() - time;
				// Get out of try/catch clause
				nextTick(next);
			}
		}, function (err) { nextTick(function () { throw err; }); });
	};
	time = now();
	while (j--) self();

// Deferred
}, function () {
	var i = count, j = count, dlstat;
	dlstat = function (path) {
		var def = new Deferred();
		lstat(path, function (err, stats) { def.resolve(err || stats); });
		return def.promise;
	};

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) next(); // Ignore first
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;
	dlstat = function (path) {
		var def = new Deferred();
		lstat(path, function (err, stats) { def.resolve(err || stats); });
		return def.promise;
	};

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) {
				data["Deferred: Dedicated wrapper"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat = promisify(lstat);

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) next(); // Ignore first
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat = promisify(lstat);

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) {
				data["Deferred: Promisify (generic wrapper)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var dlstat = promisify(lstat);

	time = now();
	deferred.map(files, function (name) {
		return dlstat(name);
	}).end(function () {
		next();
	});
}, function () {
	var dlstat = promisify(lstat);

	time = now();
	deferred.map(files, function (name) {
		return dlstat(name);
	}).end(function () { next(); });
}, function () {
	var dlstat = promisify(lstat);

	time = now();
	deferred.map(files, function (name) {
		return dlstat(name);
	}).end(function () {
		data["Deferred: Map + Promisify"] = now() - time;
		next();
	});

// Q
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = Q.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) next();
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = Q.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) {
				data["Q: Dedicated wrapper"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat = Q.nbind(lstat, null);

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) next();
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat = Q.nbind(lstat, null);

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) {
				data["Q: nbind (generic wrapper)"] = now() - time;
				// Get out of try/catch clause
				next();
			}
		});
	};
	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = when.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) nextTick(next);
		}, function (e) {
			nextTick(function () { throw e; });
		});
	};

	time = now();
	while (j--) self();
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = when.defer();
		lstat(path, function (err, stats) {
			if (err) def.reject(err);
			else def.resolve(stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) {
				data["When: Dedicated wrapper"] = now() - time;
				nextTick(next);
			}
		}, function (e) {
			nextTick(function () { throw e; });
		});
	};

	time = now();
	while (j--) self();
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
