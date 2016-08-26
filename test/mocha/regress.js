var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("regressions", function() {
    specify("should be able to call .then more than once inside that promise's handler", function() {
        var called = 0;
        var resolve;
        var promise = new Promise(function() {
            resolve = arguments[0];
        });
        return new Promise(function(resolve) {
            promise.then(function() {
                called++;
                promise.then(function(){
                    called++;
                });
                promise.then(function(){
                    called++;
                    assert.equal(4, called);
                    resolve();
                });
            });

            promise.then(function() {
                called++;
            });

            setTimeout(resolve, 1);
        });

    });

    specify("should be able to nest arbitrary amount of then handlers on already resolved promises", function() {
        var called = 0;
        var resolve;
        var promise = Promise.resolve();
        return new Promise(function(resolve) {
            promise.then(function() {
                called++;
                promise.then(function(){
                    called++;
                    promise.then(function(){
                        called++;
                    });
                    promise.then(function(){
                        called++;
                    });
                });
                promise.then(function(){
                    promise.then(function(){
                        called++;
                    });
                    promise.then(function(){
                        called++;
                        assert.equal(8, called);
                        resolve();
                    });
                    called++;
                });
            });

            promise.then(function() {
                called++;
            });
        });
    });

    specify("github-682", function() {
        var o = {
            then: function(f) {
                setTimeout(function() {
                    delete o.then;
                    f(o);
                }, 1);
            }
        };

        return Promise.resolve(o).then(function(value) {
            assert.equal(o, value);
        });
    });

    specify("gh-1006", function() {
        return Promise.resolve().then(function() {
            new Promise(function() {}).tap(function() {}).cancel();
        });
    });

    if (testUtils.isNodeJS) {
        describe("github-689", function() {
            var originalProperty = Object.getOwnPropertyDescriptor(process, "domain");
            var bindCalls = 0;

            beforeEach(function() {
                bindCalls = 0;
            });

            before(function() {
                Object.defineProperty(process, "domain", {
                    writable: true,
                    enumerable: true,
                    configurable: true,
                    value: {
                        emit: function() {},
                        bind: function(fn) {
                            bindCalls++;
                            // Ensure non-strict mode.
                            return new Function("fn", "return function() {return fn.apply(this, arguments);}")(fn);
                        },
                        enter: function() {},
                        exit: function() {}
                    }
                });
            });

            after(function() {
                Object.defineProperty(process, "domain", originalProperty);
            });

            specify(".return", function() {
                return Promise.resolve().thenReturn(true).then(function(val) {
                    assert.strictEqual(val, true);
                    assert.strictEqual(bindCalls, 4);
                });
            });

            specify(".throw", function() {
                return Promise.resolve().thenThrow(true).then(assert.fail, function(err) {
                    assert.strictEqual(err, true);
                    assert.strictEqual(bindCalls, 5);
                });
            });

            specify(".finally", function() {
                return Promise.resolve(true).lastly(function() {
                    return Promise.delay(1);
                }).then(function(val) {
                    assert.strictEqual(val, true);
                    assert.strictEqual(bindCalls, 6);
                });
            });
        });

        describe("long promise chain stack overflow", function() {
            specify("mapSeries", function() {
                var array = new Array(5000);
                for (var i = 0; i < array.length; ++i) {
                    array[i] = null;
                }

                var theError = new Error();

                var queryAsync = Promise.promisify(function(cb) {
                    process.nextTick(function() {
                        cb(theError);
                    }, 1);
                });

                return Promise.mapSeries(array, function() {
                    return queryAsync();
                }).caught(function(e) {
                    assert.strictEqual(e.cause, theError);
                });
            });
        });
    }


});
