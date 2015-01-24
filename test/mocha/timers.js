"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var Q = Promise;
var globalObject = typeof window !== "undefined" ? window : new Function("return this;")();
/*
Copyright 2009–2012 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

describe("timeout", function () {
    it("should do nothing if the promise fulfills quickly", function (done) {
        Promise.delay(10).timeout(200).then(function(){
            done();
        });
    });

    it("should do nothing if the promise rejects quickly", function (done) {
        var goodError = new Error("haha!");
        Promise.delay(10)
        .then(function () {
            throw goodError;
        })
        .timeout(200)
        .then(undefined, function (error) {
            assert(error === goodError);
            done();
        });
    });

    it("should reject with a timeout error if the promise is too slow", function (done) {
        Promise.delay(100)
        .timeout(10)
        .caught(Promise.TimeoutError, function(){
            done();
        })
    });

    it("should pass through progress notifications", function (done) {
        var deferred = Promise.defer();

        var progressValsSeen = [];
        var promise = Promise.resolve(deferred.promise).timeout(300).then(function () {
            assert.deepEqual(progressValsSeen, [1, 2, 3]);
            done();
        }, undefined, function (progressVal) {
            progressValsSeen.push(progressVal);
        });

        Promise.resolve().then(function(){
            deferred.progress(1);
            deferred.progress(2);
            deferred.progress(3);
            deferred.resolve();
        });
    });

    it("should reject with a custom timeout error if the promise is too slow and msg was provided", function (done) {
        Promise.delay(100)
        .timeout(10, "custom")
        .caught(Promise.TimeoutError, function(e){
            assert(/custom/i.test(e.message));
            done();
        });
    });

    it("should propagate the timeout error to cancellable parents", function(done) {
        function doExpensiveOp() {
            return new Promise(function() {

            })
            .cancellable()
            .caught(Promise.TimeoutError, function(e) {
                done();
            })
        }

        doExpensiveOp().timeout(100);
    });

    var globalsAreReflectedInGlobalObject = (function(window) {
        var fn = function(id){return clearTimeout(id);};
        var old = window.clearTimeout;
        window.clearTimeout = fn;
        var ret = clearTimeout === fn;
        window.clearTimeout = old;
        return ret;
    })(globalObject);

    if (globalsAreReflectedInGlobalObject) {
        it("should clear timeouts when success", function(done) {
            var old = globalObject.clearTimeout;
            var handleSet = false;
            globalObject.clearTimeout = function(handle) {
                handleSet = true;
                globalObject.clearTimeout = old;
            };

            Promise.delay(10).timeout(100).then(function() {
                assert(handleSet);
                done();
            });
        });

        it("should clear timeouts when assert.fail", function(done) {
            var old = globalObject.clearTimeout;
            var handleSet = false;
            globalObject.clearTimeout = function(handle) {
                handleSet = true;
                globalObject.clearTimeout = old;
            };

            Promise.delay(100).timeout(10).then(null, function() {
                assert(handleSet);
                done();
            });
        });
    }
});

describe("delay", function () {
    it("should delay fulfillment", function (done) {
        var promise = Promise.delay(80);

        setTimeout(function () {
            assert(promise.isPending())
            setTimeout(function(){
                assert(promise.isFulfilled());
                done();
            }, 80);
        }, 30);
    });

    it("should not delay rejection", function (done) {
        var promise = Promise.reject(5).delay(50);

        promise.caught(function(){});

        Promise.delay(20).then(function () {
            assert(!promise.isPending());
            done();
        });
    });

    it("should treat a single argument as a time", function (done) {
        var promise = Promise.delay(50);

        setTimeout(function () {
            assert(promise.isPending());
            done();
        }, 40);

    });

    it("should treat two arguments as a value + a time", function (done) {
        var promise = Promise.delay("what", 50);

        setTimeout(function () {
            assert(promise.isPending());
        }, 25);

        promise.then(function (value) {
            assert(value === "what");
            done();
        });
    });

    it("should delay after resolution", function () {
        var promise1 = Promise.delay("what", 30);
        var promise2 = promise1.delay(30);

        setTimeout(function () {
            assert(!promise1.isPending())
            assert(promise2.isPending());
        }, 50);

        return promise2.then(function (value) {
            assert(value === "what");
        });
    });

    it("should pass through progress notifications from passed promises", function (done) {
        var deferred = Promise.defer();

        var progressValsSeen = [];
        var promise = Promise.delay(deferred.promise, 100).then(function () {
            assert.deepEqual(progressValsSeen, [1, 2, 3]);
            done();
        }, undefined, function (progressVal) {
            progressValsSeen.push(progressVal);
        });

        Promise.delay(5).then(function () { deferred.progress(1); });
        Promise.delay(15).then(function () { deferred.progress(2); });
        Promise.delay(25).then(function () { deferred.progress(3); });
        Promise.delay(35).then(function () { deferred.resolve(); });
    });

    it("should resolve follower promise's value", function(done) {
        var resolveF;
        var f = new Promise(function() {
            resolveF = arguments[0];
        });
        var v = new Promise(function(f) {
            setTimeout(function() {
                f(3);
            }, 13);
        });
        resolveF(v);
        Promise.delay(f, 100).then(function(value) {
            assert.equal(value, 3);
            done();
        });
    });
});
