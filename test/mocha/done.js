"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var isNodeJS = testUtils.isNodeJS;

/*!
 *
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
describe("done", function () {
    var errCount = 0;
    var safeError = new Error("safe_error");

    describe("when the promise is fulfilled", function () {
        describe("and the callback does not throw", function () {
            it("should call the callback and return nothing", function () {
                var called = false;
                var promise = Promise.resolve();

                var returnValue = promise.done(function () {
                    called = true;
                });

                return promise.lastly(function () {
                    assert.equal(called,true);
                    assert.equal(returnValue,undefined);
                });
            });
        });

        if (isNodeJS) {
            describe("and the callback throws", function () {
                it("should rethrow that error in the next turn and return nothing", function() {
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Promise.resolve().done(
                        function () {
                            throw safeError;
                        }
                    );

                    return testUtils.awaitProcessExit(function(e) {
                        assert.equal(turn,1);
                        assert.equal(returnValue,undefined);
                    });
                });
            });
        }
    });


    describe("when the promise is rejected", function () {
        describe("and the errback handles it", function () {
            it("should call the errback and return nothing", function () {
                var called = false;

                var promise = Promise.reject("unsafe_error");

                var returnValue = promise.done(
                    function () { },
                    function () {
                        called = true;
                    }
                );

                return promise.caught(function(){}).lastly(function () {
                    assert.equal(called,true);
                    assert.equal(returnValue,undefined);
                });
            });
        });

        if (isNodeJS) {
            describe("and the errback throws", function () {
                it("should rethrow that error in the next turn and return nothing", function() {
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Promise.reject("unsafe_error").done(
                        null,
                        function () {
                            throw safeError;
                        }
                    );
                    return testUtils.awaitProcessExit(function(e) {
                        assert.equal(turn,1);
                        assert.equal(returnValue,undefined);
                    });
                });
            });


            describe("and there is no errback", function () {
                it("should throw the original error in the next turn", function() {
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Promise.reject(safeError).done();
                    return testUtils.awaitProcessExit(function(e) {
                        assert.equal(turn,1);
                        assert.equal(returnValue,undefined);
                    });
                });
            });
        }
    });
});
