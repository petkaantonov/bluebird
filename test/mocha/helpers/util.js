var assert = require("assert");
var token = {};
module.exports = {
    awaitGlobalException: function(fn, done) {
        if (typeof process !== "undefined" && typeof process.version === "string") {
            return new Promise(function(resolve, reject) {
                var listeners = process.listeners("uncaughtException");
                process.removeAllListeners("uncaughtException");
                process.on("uncaughtException", function(e) {
                    var err;
                    var ret;
                    try {
                        ret = fn(e);
                    } catch (e) {
                        err = e;
                    }
                    if (!err && ret === false) return;
                    process.removeAllListeners("uncaughtException");
                    listeners.forEach(function(listener) {
                        process.on("uncaughtException", listener);
                    });

                    Promise.delay(1).then(function() {
                        if (err) reject(err);
                        resolve();
                    });
                });
            });
        } else {
            return Promise.delay(1);
        }
    },

    addDeferred: function(Promise) {
        Promise.defer = Promise.pending = function() {
            var ret = {};
            ret.promise = new Promise(function(resolve, reject) {
                ret.resolve = ret.fulfill = resolve;
                ret.reject = reject;
            });
            ret.progress = function(value) {
                ret.promise._progress(value);
            };
            return ret;
        };
        return Promise;
    },

    returnToken: function() {
        return token;
    },

    assertToken: function(val) {
        assert.strictEqual(token, val);
    },

    getSpy: function() {
        var resolve, reject;
        var promise = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        }).timeout(500);
        var ret = function(fn) {
            ret.callback = fn;
            return ret.node;
        };
        ret.promise = promise;
        ret.node = function() {
            try {
                ret.callback.apply(this, arguments);
                resolve();
            } catch (e) {
                reject(e);
            }
        };
        return ret;
    },

    awaitDomainException: function(onError, fn) {
        var domain;
        var resolve, reject;
        var promise = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        }).timeout(500).lastly(function() {
            if (domain) domain.dispose();
        });
        domain = require('domain').create();
        domain.on("error", function(e) {
            try {
                onError(e);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        domain.run(fn);
        return promise;
    },

    //Since there is only a single handler possible at a time, older
    //tests that are run just before this file could affect the results
    //that's why there is 500ms limit in grunt file between each test
    //beacuse the unhandled rejection handler will run within 100ms right now
    onUnhandledFail: function(testFunction) {
        return new Promise(function(resolve, reject) {
            var err = new Error("Reporting handled rejection as unhandled from: " +
                    testFunction);
            Promise.onPossiblyUnhandledRejection(function() {
                reject(err);
            });
            Promise.delay(25).then(resolve);
        }).lastly(function() {
            Promise.onPossiblyUnhandledRejection(null);
        });
    },

    onUnhandledSucceed: function(testAgainst, count) {
        return new Promise(function(resolveTest, reject) {
            var total = typeof count === "number" ? count : 1;
            var cur = 0;

            function resolve(e) {
                cur++;
                if (cur >= total) {
                    resolveTest(e);
                }
            }

            Promise.onPossiblyUnhandledRejection(function(e){
                 if (testAgainst !== undefined) {
                    try {
                        if (typeof testAgainst === "function") {
                            assert(testAgainst(e));
                        }
                        else {
                            assert.equal(testAgainst, e);
                        }
                        resolve(e);
                    }
                    catch (e) {
                        reject(e);
                    }
                 } else {
                    resolve(e);
                 }
            });
            Promise.delay(200).then(function() {
                var message = "Expected onPossiblyUnhandledRejection to be called " +
                    total + " times but it was only called " + cur + " times";
                reject(new Error(message));
            });
        }).lastly(function() {
            Promise.onPossiblyUnhandledRejection(null);
        });

    },

    //Used in expressions like: onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    //If strict mode is supported NFEs work, if it is not, NFEs don't work but arguments.callee does
    isStrictModeSupported: (function() {
        try {
            new Function("'use strict'; with({});");
            return false;
        }
        catch (e) {
            return true;
        }
    })(),

    noop: function(v) {
        return v;
    },

    isSubset: function(subset, superset) {
        var i, subsetLen;

        subsetLen = subset.length;

        if (subsetLen > superset.length) {
            return false;
        }

        for(i = 0; i<subsetLen; i++) {
            if(!module.exports.contains(superset, subset[i])) {
                return false;
            }
        }

        return true;
    },

    contains: function(arr, result) {
        return arr.indexOf(result) > -1;
    },

    fakeResolved: function(val) {
        return {
            then: function(callback) {
                return fakeResolved(callback ? callback(val) : val);
            }
        };
    },

    fakeRejected: function(reason) {
        return {
            then: function(callback, errback) {
                return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
            }
        };
    },

    assertFulfilled: function(p, v) {
        assert.strictEqual(p.value(), v);
    },

    assertRejected: function(p, v) {
        assert.strictEqual(p.error(), v);
    },

    ecmaScript5: (function() {"use strict"
      return this === undefined;
    })(),
    isNodeJS: typeof process !== "undefined" && typeof process.execPath === "string"
};

if (module.exports.isNodeJS) {
    var version = process.version.split(".").map(Number);
    module.exports.isRecentNode = version[0] > 0 || version[1] > 10;
} else {
    module.exports.isRecentNode = false;
}
