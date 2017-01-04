"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var assertLongTrace = require("./helpers/assert_long_trace.js");
var awaitLateQueue = testUtils.awaitLateQueue;

function get(arg) {
    return {
        then: function(ful, rej) {
            ful(arg)
        }
    }
}

function fail(arg) {
    return {
        then: function(ful, rej) {
            rej(arg)
        }
    };
}

Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

var error = new Error("asd");

describe("yielding", function() {

    specify("non-promise should throw", function() {
        return Promise.coroutine(function*(){

            var a = yield {};
            assert.fail();
            return 4;

        })().then(assert.fail).caught(function(e){
            assert(e instanceof TypeError);
        });
    });

    specify("an array should implicitly Promise.all them", function() {
        var a = Promise.defer();
        var ap = a.promise;
        var b = Promise.defer();
        var bp = b.promise;
        var c = Promise.defer();
        var cp = c.promise;


        setTimeout(function(){
            a.fulfill(1);
            b.fulfill(2);
            c.fulfill(3);
        }, 1);
        return Promise.coroutine(function*(){
            return yield [ap, bp, cp];
        })().then(function(r) {
            //.spread will also implicitly use .all() so that cannot be used here
            var a = r[0]; var b = r[1]; var c = r[2];
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    specify("non-promise should throw but be catchable", function() {

        return Promise.coroutine(function*(){
            try {
                var a = yield {};
                assert.fail();
            }
            catch (e){
                assert(e instanceof TypeError);
                return 4;
            }

        })().then(function(val){
            assert.equal(val, 4);
        });
    });

    specify("yielding a function should not call the function", function() {
        let functionWasCalled = false;
        return Promise.coroutine(function*(){
            try {
                yield (function() {functionWasCalled = true;});
            } 
            catch(e){
                assert(e instanceof TypeError);
                assert.equal(functionWasCalled, false);
                return 4;
            }
        })().then(function(val){
            assert.equal(val, 4);
        });
    });
});

describe("thenables", function(){

    specify("when they fulfill, the yielded value should be that fulfilled value", function(){

        return Promise.coroutine(function*(){

            var a = yield get(3);
            assert.equal(a, 3);
            return 4;

        })().then(function(arg){
            assert.equal(arg, 4);
        });

    });


    specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(){

        return Promise.coroutine(function*(){
            var a = yield fail(error);
            assert.fail();

        })().then(assert.fail).then(assert.fail, function(e){
            assert.equal(e, error);
        });

    });

    specify("when they reject, and the generator has try.caught, it should continue working normally", function(){

        return Promise.coroutine(function*(){
            try {
                var a = yield fail(error);
            }
            catch (e) {
                return e;
            }
            assert.fail();

        })().then(function(v){
            assert.equal(v, error);
        });

    });

    specify("when they fulfill but then throw, it should become rejection", function(){

        return Promise.coroutine(function*(){
            var a = yield get(3);
            assert.equal(a, 3);
            throw error;
        })().then(assert.fail, function(e){
            assert.equal(e, error);
        });
    });
});

describe("yield loop", function(){

    specify("should work", function(){
        return Promise.coroutine(function* () {
            var a = [1,2,3,4,5];

            for (var i = 0, len = a.length; i < len; ++i) {
                a[i] = yield get(a[i] * 2);
            }

            return a;
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
        });
    });

    specify("inside yield should work", function(){
        return Promise.coroutine(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.all(a.map(function(v){
                return Promise.coroutine(function *() {
                    return yield get(v*2);
                })();
            }));
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
        });
    });

    specify("with simple map should work", function(){
        return Promise.coroutine(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.map(a, function(v){
                return Promise.cast(get(v*2));
            });
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
        });
    });

});


describe("Promise.coroutine", function() {
    describe("thenables", function() {
        specify("when they fulfill, the yielded value should be that fulfilled value", function(){

            return Promise.coroutine(function*(){

                var a = yield get(3);
                assert.equal(a, 3);
                return 4;

            })().then(function(arg){
                assert.equal(arg, 4);
            });

        });


        specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(){

            return Promise.coroutine(function*(){
                var a = yield fail(error);
                assert.fail();

            })().then(assert.fail).then(assert.fail, function(e){
                assert.equal(e, error);
            });

        });

        specify("when they reject, and the generator has try.caught, it should continue working normally", function(){

            return Promise.coroutine(function*(){
                try {
                    var a = yield fail(error);
                }
                catch (e) {
                    return e;
                }
                assert.fail();

            })().then(function(v){
                assert.equal(v, error);
            });

        });

        specify("when they fulfill but then throw, it should become rejection", function(){

            return Promise.coroutine(function*(){
                var a = yield get(3);
                assert.equal(a, 3);
                throw error;
            })().then(assert.fail).then(assert.fail, function(e){
                assert.equal(e, error);
            });
        });

        specify("when they are already fulfilled, the yielded value should be returned asynchronously", function(){
            var value;

            var promise = Promise.coroutine(function*(){
                yield Promise.resolve();
                value = 2;
            })();

            value = 1;

            return promise.then(function(){
                assert.equal(value, 2);
            });
        });

        specify("when they are already rejected, the yielded reason should be thrown asynchronously", function(){
            var value;

            var promise = Promise.coroutine(function*(){
                try {
                    yield Promise.reject();
                }
                catch (e) {
                    value = 2;
                }
            })();

            value = 1;

            return promise.then(function(){
                assert.equal(value, 2);
            });
        });
    });

    describe("yield loop", function(){

        specify("should work", function(){
            return Promise.coroutine(function* () {
                var a = [1,2,3,4,5];

                for (var i = 0, len = a.length; i < len; ++i) {
                    a[i] = yield get(a[i] * 2);
                }

                return a;
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
            });
        });

        specify("inside yield should work", function(){
            return Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.all(a.map(function(v){
                    return Promise.coroutine(function *() {
                        return yield get(v*2);
                    })();
                }));
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
            });
        });

        specify("with simple map should work", function(){
            return Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.map(a, function(v){
                    return Promise.cast(get(v*2));
                });
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
            });
        });

    });

    describe("when using coroutine as a method", function(){

        function MyClass() {
            this.goblins = 3;
        }

        MyClass.prototype.spawnGoblins = Promise.coroutine(function* () {
            this.goblins = yield get(this.goblins+1);
        });


        specify("generator function's receiver should be the instance too", function() {
            var a = new MyClass();
            var b = new MyClass();

            return Promise.join(a.spawnGoblins().then(function(){
                return a.spawnGoblins()
            }), b.spawnGoblins()).then(function(){
                assert.equal(a.goblins, 5);
                assert.equal(b.goblins, 4);
            });

        });
    });
});

describe("Spawn", function() {
    it("should work", function() {
        return Promise.spawn(function*() {
            return yield Promise.resolve(1);
        }).then(function(value) {
            assert.strictEqual(value, 1);
        });
    });
    it("should return rejected promise when passed non function", function() {
        return Promise.spawn({}).then(assert.fail, function(err) {
            assert(err instanceof Promise.TypeError);
        });
    });
});

describe("custom yield handlers", function() {
    specify("should work with timers", function() {
        var n = 0;
        Promise.coroutine.addYieldHandler(function(v) {
            if (typeof v === "number") {
                n = 1;
                return Promise.resolve(n);
            }
        });


        return Promise.coroutine(function*() {
            return yield 50;
        })().then(function(value) {
            assert.equal(value, 1);
            assert.equal(n, 1);
        });
    });

    var _ = (function() {
        var promise = null;
        Promise.coroutine.addYieldHandler(function(v) {
            if (v === void 0 && promise != null) {
                return promise;
            }
            promise = null;
        });
        return function() {
          var cb;
          promise = Promise.fromNode(function(callback) {
            cb = callback;
          });
          return cb;
        };
    })();

    specify("Should work with callbacks", function(){
        var callbackApiFunction = function(a, b, c, cb) {
            setTimeout(function(){
                cb(null, [a, b, c]);
            }, 1);
        };

        return Promise.coroutine(function*() {
            return yield callbackApiFunction(1, 2, 3, _());
        })().then(function(result) {
            assert(result.length === 3);
            assert(result[0] === 1);
            assert(result[1] === 2);
            assert(result[2] === 3);
        });
    });

    specify("should work with thunks", function(){
        Promise.coroutine.addYieldHandler(function(v) {
            if (typeof v === "function") {
                var cb;
                var promise = Promise.fromNode(function(callback) {
                    cb = callback;
                });
                try { v(cb); } catch (e) { cb(e); }
                return promise;
            }
        });

        var thunk = function(a) {
            return function(callback) {
                setTimeout(function(){
                    callback(null, a*a);
                }, 1);
            };
        };

        return Promise.coroutine(function*() {
            return yield thunk(4);
        })().then(function(result) {
            assert(result === 16);
        });
    });

    specify("individual yield handler", function() {
        var dummy = {};
        var yieldHandler = function(value) {
            if (value === dummy) return Promise.resolve(3);
        };
        var coro = Promise.coroutine(function* () {
            return yield dummy;
        }, {yieldHandler: yieldHandler});

        return coro().then(function(result) {
            assert(result === 3);
        });
    });

    specify("yield handler that throws", function() {
        var dummy = {};
        var unreached = false;
        var err = new Error();
        var yieldHandler = function(value) {
            if (value === dummy) throw err;
        };

        var coro = Promise.coroutine(function* () {
            yield dummy;
            unreached = true;
        }, {yieldHandler: yieldHandler});

        return coro().then(assert.fail, function(e) {
            assert.strictEqual(e, err);
            assert(!unreached);
        });
    });

    specify("yield handler is not a function", function() {
        try {
            Promise.coroutine.addYieldHandler({});
        } catch (e) {
            assert(e instanceof Promise.TypeError);
            return;
        }
        assert.fail();
    });
});

if (Promise.hasLongStackTraces()) {
    describe("Long stack traces with coroutines as context", function() {
        it("1 level", function() {
            return Promise.coroutine(function* () {
                yield Promise.delay(10);
                throw new Error();
            })().then(assert.fail, function(e) {
                assertLongTrace(e, 1+1, [2]);
            });
        });
        it("4 levels", function() {
            var secondLevel = Promise.coroutine(function* () {
                yield thirdLevel();
            });
            var thirdLevel = Promise.coroutine(function* () {
                yield fourthLevel();
            });
            var fourthLevel = Promise.coroutine(function* () {
                throw new Error();
            });

            return Promise.coroutine(function* () {
                yield secondLevel();
            })().then(assert.fail, function(e) {
                assertLongTrace(e, 4+1, [2, 2, 2, 2]);
            });
        });
    });
}

describe("Cancellation with generators", function() {
    specify("input immediately cancelled", function() {
        var cancelled = 0;
        var finalled = 0;
        var unreached = 0;

        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();

        var asyncFunction = Promise.coroutine(function* () {
            try {
                yield p;
                unreached++;
            } catch(e) {
                if (e === Promise.coroutine.returnSentinel) throw e;
                unreached++;
            } finally {
                yield Promise.resolve();
                finalled++;
            }
            unreached++;
        });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        asyncFunction()
            .then(reject, function(e) {
                if(!(e instanceof Promise.CancellationError)) reject(new Error());
            })
            .lastly(function() {
                finalled++;
                resolve();
            });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(2, finalled);
                assert.equal(0, cancelled);
                assert.equal(0, unreached);
            });
        });
    });

    specify("input eventually cancelled", function() {
        var cancelled = 0;
        var finalled = 0;
        var unreached = 0;

        var p = new Promise(function(_, __, onCancel) {});
        var asyncFunction = Promise.coroutine(function* () {
            try {
                yield p;
                unreached++;
            } catch(e) {
                if (e === Promise.coroutine.returnSentinel) throw e;
                unreached++;
            } finally {
                yield Promise.resolve();
                finalled++;
            }
            unreached++;
        });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        asyncFunction()
            .then(reject, reject)
            .lastly(function() {
                finalled++;
                resolve();
            });

        Promise.delay(1).then(function() {
            p.cancel();
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(2, finalled);
                assert.equal(0, cancelled);
                assert.equal(0, unreached);
            });
        });
    });

    specify("output immediately cancelled", function() {
        var cancelled = 0;
        var finalled = 0;
        var unreached = 0;

        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });

        var asyncFunction = Promise.coroutine(function* () {
            try {
                yield p;
                unreached++;
            } catch(e) {
                if (e === Promise.coroutine.returnSentinel) throw e;
                unreached++;
            } finally {
                yield Promise.resolve()
                finalled++;
            }
            unreached++;
        });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        var output = asyncFunction()
            .then(reject, reject)
            .lastly(function() {
                finalled++;
                resolve();
            });

        output.cancel();

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(3, finalled);
                assert.equal(1, cancelled);
                assert.equal(0, unreached);
            });
        });
    });

    specify("output eventually cancelled", function() {
        var cancelled = 0;
        var finalled = 0;
        var unreached = 0;

        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });

        var asyncFunction = Promise.coroutine(function* () {
            try {
                yield p;
                unreached++;
            } catch(e) {
                if (e === Promise.coroutine.returnSentinel) throw e;
                unreached++;
            } finally {
                yield Promise.resolve()
                finalled++;
            }
            unreached++;
        });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        var output = asyncFunction()
            .then(reject, reject)
            .lastly(function() {
                finalled++;
                resolve();
            });

        Promise.delay(1).then(function() {
            output.cancel();
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(3, finalled);
                assert.equal(1, cancelled);
                assert.equal(0, unreached);
            });
        });
    });


    specify("finally block runs before finally handler", function(done) {
        var finallyBlockCalled = false;
        var asyncFn = Promise.coroutine(function* () {
            try {
                yield Promise.delay(100);
            } finally {
                yield Promise.delay(100);
                finallyBlockCalled = true;
            }
        });
        var p = asyncFn();
        Promise.resolve().then(function() {
            p.cancel();
        });
        p.finally(function() {
            assert.ok(finallyBlockCalled, "finally block should have been called before finally handler");
            done();
        }).catch(done);
    });
});
