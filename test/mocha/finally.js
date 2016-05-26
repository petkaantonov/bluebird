"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
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

describe("finally", function () {

    var exception1 = new Error("boo!");
    var exception2 = new Promise.TypeError("evil!");

    describe("when nothing is passed", function() {
        it("should do nothing", function() {
            return Promise.resolve("foo")
                .lastly()
                .lastly()
                .lastly()
                .lastly()
                .then(function(val){
                    assert(val === "foo");
                })
        });
    });

    describe("when the promise is fulfilled", function () {

        it("should call the callback", function() {
            var called = false;

            return Promise.resolve("foo")
            .lastly(function () {
                called = true;
            })
            .then(function () {
                assert.equal(called,true);
            });
        });

        it("should fulfill with the original value", function() {
            return Promise.resolve("foo")
            .lastly(function () {
                return "bar";
            })
            .then(function (result) {
                assert.equal(result,"foo");
            });
        });

        describe("when the callback returns a promise", function () {

            describe("that is fulfilled", function () {
                it("should fulfill with the original reason after that promise resolves", function() {
                    var promise = Promise.delay(1);

                    return Promise.resolve("foo")
                    .lastly(function () {
                        return promise;
                    })
                    .then(function (result) {
                        assert.equal(promise.isPending(),false);
                        assert.equal(result,"foo");
                    });
                });
            });

            describe("that is rejected", function () {
                it("should reject with this new rejection reason", function() {
                    return Promise.resolve("foo")
                    .lastly(function () {
                        return Promise.reject(exception1);
                    })
                    .then(function () {
                        assert.equal(false,true);
                    },
                    function (exception) {
                        assert.equal(exception,exception1);
                    });
                });
            });

        });

        describe("when the callback throws an exception", function () {
            it("should reject with this new exception", function() {
                return Promise.resolve("foo")
                .lastly(function () {
                    throw exception1;
                })
                .then(function () {
                    assert.equal(false,true);
                },
                function (exception) {
                    assert.equal(exception,exception1);
                });
            });
        });

    });

    describe("when the promise is rejected", function () {

        it("should call the callback", function() {
            var called = false;

            return Promise.reject(exception1)
            .lastly(function () {
                called = true;
            })
            .then(function () {
                assert.fail();
            }, function () {
                assert.equal(called,true);
            });
        });

        it("should reject with the original reason", function() {
            return Promise.reject(exception1)
            .lastly(function () {
                return "bar";
            })
            .then(function () {
                assert.equal(false,true);
            },
            function (exception) {
                assert.equal(exception,exception1);
            });
        });

        describe("when the callback returns a promise", function () {

            describe("that is fulfilled", function () {
                it("should reject with the original reason after that promise resolves", function() {
                    var promise = Promise.delay(1);

                    return Promise.reject(exception1)
                    .lastly(function () {
                        return promise;
                    })
                    .then(function () {
                        assert.equal(false,true);
                    },
                    function (exception) {
                        assert.equal(exception,exception1);
                        assert.equal(promise.isPending(),false);
                    });
                });
            });

            describe("that is rejected", function () {
                it("should reject with the new reason", function() {
                    return Promise.reject(exception1)
                    .lastly(function () {
                        return Promise.reject(exception2);
                    })
                    .then(function () {
                        assert.equal(false,true);
                    },
                    function (exception) {
                        assert.equal(exception,exception2);
                    });
                });
            });

        });

        describe("when the callback throws an exception", function () {
            it("should reject with this new exception", function() {
                return Promise.reject(exception1)
                .lastly(function () {
                    throw exception2;
                })
                .then(function () {
                    assert.equal(false,true);
                },
                function (exception) {
                    assert.equal(exception,exception2);
                });
            });
        });

    });

    describe("when the callback returns a thenable", function () {

        describe("that will fulfill", function () {
            it("should reject with the original reason after that", function() {
                var promise = {
                    then: function(fn) {
                        setTimeout(function(){
                            fn(15);
                        }, 1);
                    }
                };

                return Promise.reject(exception1)
                .lastly(function () {
                    return promise;
                })
                .then(function () {
                    assert.equal(false,true);
                },
                function (exception) {
                    assert.equal(exception,exception1);
                });
            });
        });

        describe("that is rejected", function () {
            it("should reject with the new reason", function() {
                var promise = {
                    then: function(f, fn) {
                        setTimeout(function(){
                            fn(exception2);
                        }, 1);
                    }
                };

                return Promise.reject(exception1)
                .lastly(function () {
                    return promise;
                })
                .then(function () {
                    assert.equal(false,true);
                },
                function (exception) {
                    assert.equal(exception,exception2);
                });
            });
            it("should reject with the new primitive reason", function() {
                var primitive = 3;
                var promise = {
                    then: function(f, fn) {
                        setTimeout(function(){
                            fn(primitive);
                        }, 1);
                    }
                };

                return Promise.reject(exception1)
                .lastly(function () {
                    return promise;
                })
                .then(function () {
                    assert.equal(false,true);
                },
                function (exception) {
                    assert.strictEqual(exception, primitive);
                });
            });
        });



    });
});
