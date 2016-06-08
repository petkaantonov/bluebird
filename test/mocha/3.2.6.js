"use strict";

var assert = require("assert");
var testFulfilled = require("./helpers/testThreeCases").testFulfilled;
var testRejected = require("./helpers/testThreeCases").testRejected;

var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it
var sentinel = { sentinel: "sentinel" }; // a sentinel fulfillment value to test for with strict equality
var other = { other: "other" }; // a value we don't want to be strict equal to

describe("3.2.6: `then` must return a promise: `promise2 = promise1.then(onFulfilled, onRejected)`", function () {
    specify("is a promise", function () {
        var promise1 = pending().promise;
        var promise2 = promise1.then();

        assert(typeof promise2 === "object" || typeof promise2 === "function");
        assert.notStrictEqual(promise2, null);
        assert.strictEqual(typeof promise2.then, "function");
    });

    describe("3.2.6.1: If either `onFulfilled` or `onRejected` returns a value that is not a promise, `promise2` " +
             "must be fulfilled with that value.", function () {
        function testValue(expectedValue, stringRepresentation) {
            describe("The value is " + stringRepresentation, function () {
                testFulfilled(dummy, function (promise1, done) {
                    var promise2 = promise1.then(function onFulfilled() {
                        return expectedValue;
                    });

                    promise2.then(function onPromise2Fulfilled(actualValue) {
                        assert.strictEqual(actualValue, expectedValue);
                        done();
                    });
                });
                testRejected(dummy, function (promise1, done) {
                    var promise2 = promise1.then(null, function onRejected() {
                        return expectedValue;
                    });

                    promise2.then(function onPromise2Fulfilled(actualValue) {
                        assert.strictEqual(actualValue, expectedValue);
                        done();
                    });
                });
            });
        }

        testValue(undefined, "`undefined`");
        testValue(null, "`null`");
        testValue(false, "`false`");
        testValue(0, "`0`");
        testValue(new Error(), "an error");
        testValue(new Date(), "a date");
        testValue({}, "an object");
        testValue({ then: 5 }, "an object with a non-function `then` property");
    });

    describe("3.2.6.2: If either `onFulfilled` or `onRejected` throws an exception, `promise2` " +
             "must be rejected with the thrown exception as the reason.", function () {
        function testReason(expectedReason, stringRepresentation) {
            describe("The reason is " + stringRepresentation, function () {
                testFulfilled(dummy, function (promise1, done) {
                    var promise2 = promise1.then(function onFulfilled() {
                        throw expectedReason;
                    });

                    promise2.then(null, function onPromise2Rejected(actualReason) {
                        assert.strictEqual(actualReason, expectedReason);
                        done();
                    });
                });
                testRejected(dummy, function (promise1, done) {
                    var promise2 = promise1.then(null, function onRejected() {
                        throw expectedReason;
                    });

                    promise2.then(null, function onPromise2Rejected(actualReason) {
                        assert.strictEqual(actualReason, expectedReason);
                        done();
                    });
                });
            });
        }

        testReason(undefined, "`undefined`");
        testReason(null, "`null`");
        testReason(false, "`false`");
        testReason(0, "`0`");
        testReason(new Error(), "an error");
        testReason(new Date(), "a date");
        testReason({}, "an object");
        testReason({ then: function () { } }, "a promise-alike");
        testReason(fulfilled(dummy), "a fulfilled promise");
        var promise = rejected(dummy); promise.caught(function(){});
        testReason(promise, "a rejected promise");
    });

    describe("3.2.6.3: If either `onFulfilled` or `onRejected` returns a promise (call it `returnedPromise`), " +
             "`promise2` must assume the state of `returnedPromise`", function () {
        describe("3.2.6.3.1: If `returnedPromise` is pending, `promise2` must remain pending until `returnedPromise` " +
                 "is fulfilled or rejected.", function () {
            testFulfilled(dummy, function (promise1, done) {
                var wasFulfilled = false;
                var wasRejected = false;

                var promise2 = promise1.then(function onFulfilled() {
                    var returnedPromise = pending().promise;
                    return returnedPromise;
                });

                promise2.then(
                    function onPromise2Fulfilled() {
                        wasFulfilled = true;
                    },
                    function onPromise2Rejected() {
                        wasRejected = true;
                    }
                );

                setTimeout(function () {
                    assert.strictEqual(wasFulfilled, false);
                    assert.strictEqual(wasRejected, false);
                    done();
                }, 100);
            });

            testRejected(dummy, function (promise1, done) {
                var wasFulfilled = false;
                var wasRejected = false;

                var promise2 = promise1.then(null, function onRejected() {
                    var returnedPromise = pending().promise;
                    return returnedPromise;
                });

                promise2.then(
                    function onPromise2Fulfilled() {
                        wasFulfilled = true;
                    },
                    function onPromise2Rejected() {
                        wasRejected = true;
                    }
                );

                setTimeout(function () {
                    assert.strictEqual(wasFulfilled, false);
                    assert.strictEqual(wasRejected, false);
                    done();
                }, 100);
            });
        });

        describe("3.2.6.3.2: If/when `returnedPromise` is fulfilled, `promise2` must be fulfilled with the same value.",
                 function () {
            describe("`promise1` is fulfilled, and `returnedPromise` is:", function () {
                testFulfilled(sentinel, function (returnedPromise, done) {
                    var promise1 = fulfilled(dummy);
                    var promise2 = promise1.then(function onFulfilled() {
                        return returnedPromise;
                    });

                    promise2.then(function onPromise2Fulfilled(value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });

                specify("a pseudo-promise", function (done) {
                    var promise1 = fulfilled(dummy);
                    var promise2 = promise1.then(function onFulfilled() {
                        return {
                            then: function (f) { f(sentinel); }
                        };
                    });

                    promise2.then(function onPromise2Fulfilled(value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });
            describe("`promise1` is rejected, and `returnedPromise` is:", function () {
                testFulfilled(sentinel, function (returnedPromise, done) {
                    var promise1 = rejected(dummy);
                    var promise2 = promise1.then(null, function onRejected() {
                        return returnedPromise;
                    });

                    promise2.then(function onPromise2Fulfilled(value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });

                specify("a pseudo-promise", function (done) {
                    var promise1 = rejected(dummy);
                    var promise2 = promise1.then(null, function onRejected() {
                        return {
                            then: function (f) { f(sentinel); }
                        };
                    });

                    promise2.then(function onPromise2Fulfilled(value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });
        });

        describe("3.2.6.3.3: If/when `returnedPromise` is rejected, `promise2` must be rejected with the same reason.",
                 function () {
            describe("`promise1` is fulfilled, and `returnedPromise` is:", function () {
                testRejected(sentinel, function (returnedPromise, done) {
                    var promise1 = fulfilled(dummy);
                    var promise2 = promise1.then(function onFulfilled() {
                        return returnedPromise;
                    });

                    promise2.then(null, function onPromise2Rejected(reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });

                specify("a pseudo-promise", function (done) {
                    var promise1 = fulfilled(dummy);
                    var promise2 = promise1.then(function onFulfilled() {
                        return {
                            then: function (f, r) { r(sentinel); }
                        };
                    });

                    promise2.then(null, function onPromise2Rejected(reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });
            describe("`promise1` is rejected, and `returnedPromise` is:", function () {
                testRejected(sentinel, function (returnedPromise, done) {
                    var promise1 = rejected(dummy);
                    var promise2 = promise1.then(null, function onRejected() {
                        return returnedPromise;
                    });

                    promise2.then(null, function onPromise2Rejected(reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });

                specify("a pseudo-promise", function (done) {
                    var promise1 = rejected(dummy);
                    var promise2 = promise1.then(null, function onRejected() {
                        return {
                            then: function (f, r) { r(sentinel); }
                        };
                    });

                    promise2.then(null, function onPromise2Rejected(reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });
        });
    });

    describe("3.2.6.4: If `onFulfilled` is not a function and `promise1` is fulfilled, `promise2` must be fulfilled " +
             "with the same value.", function () {

        function testNonFunction(nonFunction, stringRepresentation) {
            describe("`onFulfilled` is " + stringRepresentation, function () {
                testFulfilled(sentinel, function (promise1, done) {
                    var promise2 = promise1.then(nonFunction);

                    promise2.then(function onPromise2Fulfilled(value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });
        }

        testNonFunction(undefined, "`undefined`");
        testNonFunction(null, "`null`");
        testNonFunction(false, "`false`");
        testNonFunction(5, "`5`");
        testNonFunction({}, "an object");
        testNonFunction([function () { return other; }], "an array containing a function");
    });

    describe("3.2.6.5: If `onRejected` is not a function and `promise1` is rejected, `promise2` must be rejected " +
             "with the same reason.", function () {

        function testNonFunction(nonFunction, stringRepresentation) {
            describe("`onRejected` is " + stringRepresentation, function () {
                testRejected(sentinel, function (promise1, done) {
                    var promise2 = promise1.then(null, nonFunction);

                    promise2.then(null, function onPromise2Rejected(reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });
        }

        testNonFunction(undefined, "`undefined`");
        testNonFunction(null, "`null`");
        testNonFunction(false, "`false`");
        testNonFunction(5, "`5`");
        testNonFunction({}, "an object");
        testNonFunction([function () { return other; }], "an array containing a function");
    });
});
