"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var Q = Promise;
Promise.config({cancellation: true})
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
    it("should do nothing if the promise fulfills quickly", function() {
        Promise.delay(1).timeout(200).then(function(){
        });
    });

    it("should do nothing if the promise rejects quickly", function() {
        var goodError = new Error("haha!");
        return Promise.delay(1)
        .then(function () {
            throw goodError;
        })
        .timeout(200)
        .then(undefined, function (error) {
            assert(error === goodError);
        });
    });

    it("should reject with a timeout error if the promise is too slow", function() {
        return Promise.delay(1)
        .timeout(10)
        .caught(Promise.TimeoutError, function(){
        })
    });

    it("should reject with a custom timeout error if the promise is too slow and msg was provided", function() {
        return Promise.delay(1)
        .timeout(10, "custom")
        .caught(Promise.TimeoutError, function(e){
            assert(/custom/i.test(e.message));
        });
    });

    it("should cancel the parent promise once the timeout expires", function() {
        var didNotExecute = true;
        var wasRejectedWithTimeout = false;
        var p = Promise.delay(22).then(function() {
            didNotExecute = false;
        })
        p.timeout(11).thenReturn(10).caught(Promise.TimeoutError, function(e) {
            wasRejectedWithTimeout = true;
        })
        return Promise.delay(33).then(function() {
            assert(didNotExecute, "parent promise was not cancelled");
            assert(wasRejectedWithTimeout, "promise was not rejected with timeout");
        })
    });

    it("should not cancel the parent promise if there are multiple consumers", function() {
        var derivedNotCancelled = false;
        var p = Promise.delay(22);
        var derived = p.then(function() {
            derivedNotCancelled = true;
        })
        p.timeout(11).thenReturn(10)
        return Promise.delay(33).then(function() {
            assert(derivedNotCancelled, "derived promise was cancelled")
        })
    })

    var globalsAreReflectedInGlobalObject = (function(window) {
        var fn = function(id){return clearTimeout(id);};
        var old = window.clearTimeout;
        window.clearTimeout = fn;
        var ret = clearTimeout === fn;
        window.clearTimeout = old;
        return ret;
    })(globalObject);

    if (globalsAreReflectedInGlobalObject) {
        describe("timer handle clearouts", function() {
            var fakeSetTimeout, fakeClearTimeout;
            var expectedHandleType;

            before(function() {
                fakeSetTimeout = globalObject.setTimeout;
                fakeClearTimeout = globalObject.clearTimeout;
                globalObject.setTimeout = globalObject.oldSetTimeout;
                globalObject.clearTimeout = globalObject.oldClearTimeout;
                expectedHandleType = typeof (globalObject.setTimeout(function(){}, 1));
            });

            after(function() {
                globalObject.setTimeout = fakeSetTimeout;
                globalObject.clearTimeout = fakeClearTimeout;
            });

            it("should clear timeouts with proper handle type when fulfilled", function() {
                var old = globalObject.clearTimeout;
                var handleType = "empty";
                globalObject.clearTimeout = function(handle) {
                    handleType = typeof handle;
                    globalObject.clearTimeout = old;
                };

                return Promise.delay(1).timeout(10000).then(function() {
                    assert.strictEqual(expectedHandleType, handleType);
                });
            });

            it("should clear timeouts with proper handle type when rejected", function() {
                var old = globalObject.clearTimeout;
                var handleType = "empty";
                globalObject.clearTimeout = function(handle) {
                    handleType = typeof handle;
                    globalObject.clearTimeout = old;
                };

                return new Promise(function(_, reject) {
                    setTimeout(reject, 10);
                }).timeout(10000).then(null, function() {
                    assert.strictEqual(expectedHandleType, handleType);
                });
            });
        })

    }
});

describe("delay", function () {
    it("should not delay rejection", function() {
        var promise = Promise.reject(5).delay(1);

        promise.then(assert.fail, function(){});

        return Promise.delay(1).then(function () {
            assert(!promise.isPending());
        });
    });

    it("should delay after resolution", function () {
        var promise1 = Promise.delay(1, "what");
        var promise2 = promise1.delay(1);

        return promise2.then(function (value) {
            assert(value === "what");
        });
    });

    it("should resolve follower promise's value", function() {
        var resolveF;
        var f = new Promise(function() {
            resolveF = arguments[0];
        });
        var v = new Promise(function(f) {
            setTimeout(function() {
                f(3);
            }, 1);
        });
        resolveF(v);
        return Promise.delay(1, f).then(function(value) {
            assert.equal(value, 3);
        });
    });

    it("should reject with a custom error if an error was provided as a parameter", function() {
        var err = Error("Testing Errors")
        return Promise.delay(1)
            .timeout(10, err)
            .caught(function(e){
                assert(e === err);
            });
    });

});
