"use strict";

var assert = require("assert");
var testFulfilled = require("./helpers/testThreeCases").testFulfilled;

var adapter = global.adapter;
var pending = adapter.pending;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.1.2.1: When fulfilled, a promise: must not transition to any other state.", function () {
    testFulfilled(dummy, function (promise, done) {
        var onFulfilledCalled = false;

        promise.then(function onFulfilled() {
            onFulfilledCalled = true;
        }, function onRejected() {
            assert.strictEqual(onFulfilledCalled, false);
            done();
        });

        setTimeout(function(){done();}, 100);
    });

    specify("trying to fulfill then immediately reject", function (done) {
        var tuple = pending();
        var onFulfilledCalled = false;

        tuple.promise.then(function onFulfilled() {
            onFulfilledCalled = true;
        }, function onRejected() {
            assert.strictEqual(onFulfilledCalled, false);
            done();
        });

        tuple.fulfill(dummy);
        tuple.reject(dummy);
        setTimeout(function(){done();}, 100);
    });

    specify("trying to fulfill then reject, delayed", function (done) {
        var tuple = pending();
        var onFulfilledCalled = false;

        tuple.promise.then(function onFulfilled() {
            onFulfilledCalled = true;
        }, function onRejected() {
            assert.strictEqual(onFulfilledCalled, false);
            done();
        });

        setTimeout(function () {
            tuple.fulfill(dummy);
            tuple.reject(dummy);
        }, 50);
        setTimeout(function(){done();}, 100);
    });

    specify("trying to fulfill immediately then reject delayed", function (done) {
        var tuple = pending();
        var onFulfilledCalled = false;

        tuple.promise.then(function onFulfilled() {
            onFulfilledCalled = true;
        }, function onRejected() {
            assert.strictEqual(onFulfilledCalled, false);
            done();
        });

        tuple.fulfill(dummy);
        setTimeout(function () {
            tuple.reject(dummy);
        }, 50);
        setTimeout(function(){done();}, 100);
    });
});
