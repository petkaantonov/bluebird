"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

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

function delay() {
    return new Promise(function(a){
        setTimeout(a, 15);
    });
}

Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

var error = new Error("asd");

describe("yielding", function() {

    specify("non-promise should throw", function(done) {

        Promise.coroutine(function*(){

            var a = yield {};
            assert.fail();
            return 4;

        })().then(assert.fail).catch(function(e){
            assert( e instanceof TypeError );
            done();
        });
    });

    specify("an array should implicitly Promise.all them", function(done) {
        var a = Promise.pending();
        var ap = a.promise;
        var b = Promise.pending();
        var bp = b.promise;
        var c = Promise.pending();
        var cp = c.promise;
        Promise.coroutine(function*(){
            return yield [ap, bp, cp];
        })().then(function(r) {
            //.spread will also implicitly use .all() so that cannot be used here
            var a = r[0]; var b = r[1]; var c = r[2];
            assert( a === 1 );
            assert( b === 2 );
            assert( c === 3);
            done();
        });

        setTimeout(function(){
            a.fulfill(1);
            b.fulfill(2);
            c.fulfill(3);
        }, 13);
    });

    specify("non-promise should throw but be catchable", function(done) {

        Promise.coroutine(function*(){
            try {
                var a = yield {};
                assert.fail();
            }
            catch(e){
                assert( e instanceof TypeError );
                return 4;
            }

        })().then(function(val){
            assert.equal(val, 4);
            done();
        }).catch(assert.fail)
    });
});

describe("thenables", function(){

    specify("when they fulfill, the yielded value should be that fulfilled value", function(done){

        Promise.coroutine(function*(){

            var a = yield get(3);
            assert.equal(a, 3);
            return 4;

        })().then(function(arg){
            assert.equal(arg, 4);
            done();
        });

    });


    specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(done){

        Promise.coroutine(function*(){
            var a = yield fail(error);
            assert.fail();

        })().then(assert.fail).caught(function(e){
            assert.equal(e, error);
            done();
        });

    });

    specify("when they reject, and the generator has try.caught, it should continue working normally", function(done){

        Promise.coroutine(function*(){
            try {
                var a = yield fail(error);
            }
            catch(e) {
                return e;
            }
            assert.fail();

        })().then(function(v){
            assert.equal(v, error);
            done();
        });

    });

    specify("when they fulfill but then throw, it should become rejection", function(done){

        Promise.coroutine(function*(){
            var a = yield get(3);
            assert.equal(a, 3);
            throw error;
        })().then(assert.fail).caught(function(e){
            assert.equal(e, error);
            done();
        });
    });
});

describe("yield loop", function(){

    specify("should work", function(done){
        Promise.coroutine(function* () {
            var a = [1,2,3,4,5];

            for( var i = 0, len = a.length; i < len; ++i ) {
                a[i] = yield get(a[i] * 2);
            }

            return a;
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

    specify("inside yield should work", function(done){
        Promise.coroutine(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.all(a.map(function(v){
                return Promise.coroutine(function *() {
                    return yield get(v*2);
                })();
            }));
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

    specify("with simple map should work", function(done){
        Promise.coroutine(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.map(a, function(v){
                return Promise.cast(get(v*2));
            });
        })().then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

});


describe("Promise.coroutine", function() {
    describe("thenables", function() {
        specify("when they fulfill, the yielded value should be that fulfilled value", function(done){

            Promise.coroutine(function*(){

                var a = yield get(3);
                assert.equal(a, 3);
                return 4;

            })().then(function(arg){
                assert.equal(arg, 4);
                done();
            });

        });


        specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(done){

            Promise.coroutine(function*(){
                var a = yield fail(error);
                assert.fail();

            })().then(assert.fail).caught(function(e){
                assert.equal(e, error);
                done();
            });

        });

        specify("when they reject, and the generator has try.caught, it should continue working normally", function(done){

            Promise.coroutine(function*(){
                try {
                    var a = yield fail(error);
                }
                catch(e) {
                    return e;
                }
                assert.fail();

            })().then(function(v){
                assert.equal(v, error);
                done();
            });

        });

        specify("when they fulfill but then throw, it should become rejection", function(done){

            Promise.coroutine(function*(){
                var a = yield get(3);
                assert.equal(a, 3);
                throw error;
            })().then(assert.fail).caught(function(e){
                assert.equal(e, error);
                done();
            });
        });
    });

    describe("yield loop", function(){

        specify("should work", function(done){
            Promise.coroutine(function* () {
                var a = [1,2,3,4,5];

                for( var i = 0, len = a.length; i < len; ++i ) {
                    a[i] = yield get(a[i] * 2);
                }

                return a;
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
            });
        });

        specify("inside yield should work", function(done){
            Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.all(a.map(function(v){
                    return Promise.coroutine(function *() {
                        return yield get(v*2);
                    })();
                }));
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
            });
        });

        specify("with simple map should work", function(done){
            Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.map(a, function(v){
                    return Promise.cast(get(v*2));
                });
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
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


        specify("generator function's receiver should be the instance too", function( done ) {
            var a = new MyClass();
            var b = new MyClass();

            Promise.join(a.spawnGoblins().then(function(){
                return a.spawnGoblins()
            }), b.spawnGoblins()).then(function(){
                assert.equal(a.goblins, 5);
                assert.equal(b.goblins, 4);
                done();
            });

        });
    });
});

describe("custom yield handlers", function(){
    Promise.coroutine.addYieldHandler(function(v) {
        if (typeof v === "number") {
            return Promise.delay(v);
        }
    });

    specify("should work with timers", function(done){
        Promise.coroutine(function*() {
            var now = Date.now();
            yield 50;
            var then = Date.now() - now;
            return then;
        })().then(function(elapsed) {
            assert(elapsed > 40);
            done();
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
          var def = Promise.defer();
          promise = def.promise;
          return def.callback;
        };
    })();

    specify("Should work with callbacks", function(done){
        var callbackApiFunction = function(a, b, c, cb) {
            setTimeout(function(){
                cb(null, [a, b, c]);
            }, 13);
        };

        Promise.coroutine(function*() {
            return yield callbackApiFunction(1, 2, 3, _());
        })().then(function(result) {
            assert(result.length === 3);
            assert(result[0] === 1);
            assert(result[1] === 2);
            assert(result[2] === 3);
            done();
        });
    });

    Promise.coroutine.addYieldHandler(function(v) {
        if (typeof v === "function") {
            var def = Promise.defer();
            try { v(def.callback); } catch(e) { def.reject(e); }
            return def.promise;
        }
    });

    specify("should work with thunks", function(done){
        var thunk = function(a) {
            return function(callback) {
                setTimeout(function(){
                    callback(null, a*a);
                }, 13);
            };
        };

        Promise.coroutine(function*() {
            return yield thunk(4);
        })().then(function(result) {
            assert(result === 16);
            done();
        });
    });

    specify("individual yield handler", function(done) {
        var dummy = {};
        var yieldHandler = function(value) {
            if (value === dummy) return Promise.resolve(3);
        };
        var coro = Promise.coroutine(function* () {
            return yield dummy;
        }, {yieldHandler: yieldHandler});

        coro().then(function(result) {
            assert(result === 3);
            done();
        });
    });
});
