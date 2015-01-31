"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var assertLongTrace = require("./helpers/assert_long_trace.js");

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

        })().then(assert.fail).catch (function(e){
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
        return Promise.coroutine.addYieldHandler(function(v) {
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

    specify("should work with thunks", function(){
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
