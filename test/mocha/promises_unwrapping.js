"use strict";
//https://github.com/domenic/promises-unwrapping/blob/master/run-tests.js

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");

adapter.done = function (promise, onFulfilled, onRejected) {
    promise.then(onFulfilled, onRejected).caught(function (reason) {
        process.nextTick(function () {
            throw reason;
        });
    });
};

var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
Promise.resolve = Promise.fulfilled;
Promise.reject = Promise.rejected;

var sentinel = { sentinel: "SENTINEL" };

function fulfilledThenable(value) {
    var thenable = {
        timesCalled: 0,
        timesGotten: 0
    };

    Object.defineProperty(thenable, "then", {
        get: function () {
            ++thenable.timesGotten;
            return function (onFulfilled, onRejected) {
                ++this.timesCalled;
                onFulfilled(value);
            };
        }
    });

    return thenable;
}

describe("Memoization of thenables", function () {
    specify("retrieving a value twice, in parallel, should only call `then` once.", function (done) {
        var tuple = adapter.pending();
        var thenable = fulfilledThenable(sentinel);
        var derived = tuple.promise.then(function () { return thenable; });

        tuple.fulfill();

        setTimeout(function(){
            assert.strictEqual(thenable.timesCalled, 0);
            assert.strictEqual(thenable.timesGotten, 0);
            var valuesGotten = 0;

            adapter.done(derived, function (value) {
                assert.strictEqual(thenable.timesCalled, 1);
                assert.strictEqual(thenable.timesGotten, 1);
                assert.strictEqual(value, sentinel);
                ++valuesGotten;
            });

            adapter.done(derived, function (value) {
                assert.strictEqual(thenable.timesCalled, 1);
                assert.strictEqual(thenable.timesGotten, 1);
                assert.strictEqual(value, sentinel);
                ++valuesGotten;
            });

            setTimeout(function () {
                assert.strictEqual(thenable.timesCalled, 1);
                assert.strictEqual(thenable.timesGotten, 1);
                assert.strictEqual(valuesGotten, 2);
                done();
                }, 50);
        }, 50 );
    });

    specify("retrieving a value twice, in sequence, should only call `then` once.", function (done) {
        var tuple = adapter.pending();
        var thenable = fulfilledThenable(sentinel);
        var derived = tuple.promise.then(function () { return thenable; });

        tuple.fulfill();

        setTimeout( function() {
                assert.strictEqual(thenable.timesCalled, 0);
                assert.strictEqual(thenable.timesGotten, 0);
                var valuesGotten = 0;

                adapter.done(derived, function (value) {
                    assert.strictEqual(thenable.timesCalled, 1);
                    assert.strictEqual(thenable.timesGotten, 1);
                    assert.strictEqual(value, sentinel);
                    ++valuesGotten;
                });

                setTimeout(function () {
                    adapter.done(derived, function (value) {
                        assert.strictEqual(thenable.timesCalled, 1);
                        assert.strictEqual(thenable.timesGotten, 1);
                        assert.strictEqual(value, sentinel);
                        ++valuesGotten;
                    });

                    setTimeout(function () {
                        assert.strictEqual(thenable.timesCalled, 1);
                        assert.strictEqual(thenable.timesGotten, 1);
                        assert.strictEqual(valuesGotten, 2);
                        done();
                    }, 50);
                }, 50);
        }, 50);
    });

    specify("when multiple promises are resolved to the thenable", function (done) {
        var tuple1 = adapter.pending();
        var tuple2 = adapter.pending();
        var thenable = fulfilledThenable(sentinel);
        var derived1 = tuple1.promise.then(function () { return thenable; });
        var derived2 = tuple2.promise.then(function () { return thenable; });

        tuple1.fulfill();
        tuple2.fulfill();

        var valuesGotten = 0;
        adapter.done(derived1, function (value) {
            assert.strictEqual(thenable.timesCalled, 1);
            assert.strictEqual(thenable.timesGotten, 1);
            assert.strictEqual(value, sentinel);
            ++valuesGotten;
        });

        adapter.done(derived2, function (value) {
            assert.strictEqual(thenable.timesCalled, 1);
            assert.strictEqual(thenable.timesGotten, 1);
            assert.strictEqual(value, sentinel);
            ++valuesGotten;
        });

        setTimeout(function () {
            assert.strictEqual(valuesGotten, 2);
            done();
        }, 50);
    });
});

describe("Promise.all", function () {
    it("fulfills if passed an empty array", function (done) {
        adapter.done(Promise.all([]), function (value) {
            assert(Array.isArray(value));
            assert.deepEqual(value, []);
            done();
        });
    });

    it("fulfills if passed an array of mixed fulfilled promises and values", function (done) {
        adapter.done(Promise.all([0, Promise.resolve(1), 2, Promise.resolve(3)]), function (value) {
            assert(Array.isArray(value));
            assert.deepEqual(value, [0, 1, 2, 3]);
            done();
        });
    });

    it("rejects if any passed promise is rejected", function (done) {
        var foreverPending = new Promise(function () {});
        var error = new Error("Rejected");
        var rejected = Promise.reject(error);

        adapter.done(Promise.all([foreverPending, rejected]),
            function (value) {
                assert(false, "should never get here");
                done();
            },
            function (reason) {
                assert.strictEqual(reason, error);
                done();
            }
        );
    });

    it("resolves foreign thenables", function (done) {
        var normal = Promise.resolve(1);
        var foreign = { then: function (f) { f(2); } };

        adapter.done(Promise.all([normal, foreign]), function (value) {
            assert.deepEqual(value, [1, 2]);
            done();
        });
    });

    it("fulfills when passed an sparse array, skipping the omitted values", function (done) {
        //This behavior is opposite from Q and not as usable or intuitive
        done();
        /*
        adapter.done(Promise.all([Promise.resolve(0), , , Promise.resolve(1)]), function (value) {
            assert.deepEqual(value, [0, 1]);
            done();
        });*/
    });


    it("does not modify the input array", function (done) {
        var input = [0, 1];

        adapter.done(Promise.all(input), function (value) {
            assert.notStrictEqual(input, value);
            done();
        });
    });
});