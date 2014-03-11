"use strict";

var assert = require("assert");
var testRejected = require("./helpers/testThreeCases").testRejected;

var adapter = global.adapter;
var pending = adapter.pending;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.1.3.1: When rejected, a promise: must not transition to any other state.", function () {
    testRejected(dummy, function (promise, done) {
        var onRejectedCalled = false;

        promise.then(function onFulfilled() {
            assert.strictEqual(onRejectedCalled, false);
            done();
        }, function onRejected() {
            onRejectedCalled = true;
        });

        setTimeout(function(){done();}, 100);
    });

    specify("trying to reject then immediately fulfill", function (done) {
        var tuple = pending();
        var onRejectedCalled = false;

        tuple.promise.then(function onFulfilled() {
            assert.strictEqual(onRejectedCalled, false);
            done();
        }, function onRejected() {
            onRejectedCalled = true;
        });

        tuple.reject(dummy);
        tuple.fulfill(dummy);
        setTimeout(function(){done();}, 100);
    });

    specify("trying to reject then fulfill, delayed", function (done) {
        var tuple = pending();
        var onRejectedCalled = false;

        tuple.promise.then(function onFulfilled() {
            assert.strictEqual(onRejectedCalled, false);
            done();
        }, function onRejected() {
            onRejectedCalled = true;
        });

        setTimeout(function () {
            tuple.reject(dummy);
            tuple.fulfill(dummy);
        }, 50);
        setTimeout(function(){done();}, 100);
    });

    specify("trying to reject immediately then fulfill delayed", function (done) {
        var tuple = pending();
        var onRejectedCalled = false;

        tuple.promise.then(function onFulfilled() {
            assert.strictEqual(onRejectedCalled, false);
            done();
        }, function onRejected() {
            onRejectedCalled = true;
        });

        tuple.reject(dummy);
        setTimeout(function () {
            tuple.fulfill(dummy);
        }, 50);
        setTimeout(function(){done();}, 100);
    });
});
