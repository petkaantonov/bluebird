"use strict";

var assert = require("assert");
var thenables = require("./helpers/thenables");
var reasons = require("./helpers/reasons");

var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it
var sentinel = { sentinel: "sentinel" }; // a sentinel fulfillment value to test for with strict equality
var other = { other: "other" }; // a value we don't want to be strict equal to
var sentinelArray = [sentinel]; // a sentinel fulfillment value to test when we need an array

function testPromiseResolution(xFactory, test) {
    specify("via return from a fulfilled promise", function (done) {
        var promise = fulfilled(dummy).then(function onBasePromiseFulfilled() {
            return xFactory();
        });

        test(promise, done);
    });

    specify("via return from a rejected promise", function (done) {
        var promise = rejected(dummy).then(null, function onBasePromiseRejected() {
            return xFactory();
        });

        test(promise, done);
    });
}

function testCallingResolvePromise(yFactory, stringRepresentation, test) {
    describe("`y` is " + stringRepresentation, function () {
        describe("`then` calls `resolvePromise` synchronously", function () {
            function xFactory() {
                return {
                    then: function (resolvePromise) {
                        resolvePromise(yFactory());
                    }
                };
            }

            testPromiseResolution(xFactory, test);
        });

        describe("`then` calls `resolvePromise` asynchronously", function () {
            function xFactory() {
                return {
                    then: function (resolvePromise) {
                        setTimeout(function () {
                            resolvePromise(yFactory());
                        }, 0);
                    }
                };
            }

            testPromiseResolution(xFactory, test);
        });
    });
}

function testCallingRejectPromise(r, stringRepresentation, test) {
    describe("`r` is " + stringRepresentation, function () {
        describe("`then` calls `rejectPromise` synchronously", function () {
            function xFactory() {
                return {
                    then: function (resolvePromise, rejectPromise) {
                        rejectPromise(r);
                    }
                };
            }

            testPromiseResolution(xFactory, test);
        });

        describe("`then` calls `rejectPromise` asynchronously", function () {
            function xFactory() {
                return {
                    then: function (resolvePromise, rejectPromise) {
                        setTimeout(function () {
                            rejectPromise(r);
                        }, 0);
                    }
                };
            }

            testPromiseResolution(xFactory, test);
        });
    });
}

function testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, fulfillmentValue) {
    testCallingResolvePromise(yFactory, stringRepresentation, function (promise, done) {

        promise.then(function onPromiseFulfilled(value) {
            assert.strictEqual(value, fulfillmentValue);
            done();
        });
    });
}

function testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, rejectionReason) {
    testCallingResolvePromise(yFactory, stringRepresentation, function (promise, done) {

        promise.then(null, function onPromiseRejected(reason) {
            assert.strictEqual(reason, rejectionReason);
            done();
        });
    });
}

function testCallingRejectPromiseRejectsWith(reason, stringRepresentation) {
    testCallingRejectPromise(reason, stringRepresentation, function (promise, done) {

        promise.then(null, function onPromiseRejected(rejectionReason) {
            assert.strictEqual(rejectionReason, reason);
            done();
        });
    });
}

describe("2.3.3: Otherwise, if `x` is an object or function,", function () {
    describe("2.3.3.1: Let `then` be `x.then`", function () {
        describe("`x` is an object with null prototype", function () {
            var numberOfTimesThenWasRetrieved = null;

            beforeEach(function () {
                numberOfTimesThenWasRetrieved = 0;
            });

            function xFactory() {
                return Object.create(null, {
                    then: {
                        get: function () {
                            ++numberOfTimesThenWasRetrieved;
                            return function thenMethodForX(onFulfilled) {
                                onFulfilled();
                            };
                        }
                    }
                });
            }

            testPromiseResolution(xFactory, function (promise, done) {

                promise.then(function () {
                    assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
                    done();
                });
            });
        });

        describe("`x` is an object with normal Object.prototype", function () {
            var numberOfTimesThenWasRetrieved = null;

            beforeEach(function () {
                numberOfTimesThenWasRetrieved = 0;
            });

            function xFactory() {
                return Object.create(Object.prototype, {
                    then: {
                        get: function () {
                            ++numberOfTimesThenWasRetrieved;
                            return function thenMethodForX(onFulfilled) {
                                onFulfilled();
                            };
                        }
                    }
                });
            }

            testPromiseResolution(xFactory, function (promise, done) {

                promise.then(function () {
                    assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
                    done();
                });
            });
        });

        describe("`x` is a function", function () {
            var numberOfTimesThenWasRetrieved = null;

            beforeEach(function () {
                numberOfTimesThenWasRetrieved = 0;
            });

            function xFactory() {
                function x() { }

                Object.defineProperty(x, "then", {
                    get: function () {
                        ++numberOfTimesThenWasRetrieved;
                        return function thenMethodForX(onFulfilled) {
                            onFulfilled();
                        };
                    }
                });

                return x;
            }

            testPromiseResolution(xFactory, function (promise, done) {

                promise.then(function () {
                    assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
                    done();
                });
            });
        });
    });

    describe("2.3.3.2: If retrieving the property `x.then` results in a thrown exception `e`, reject `promise` with " +
             "`e` as the reason.", function () {
        function testRejectionViaThrowingGetter(e, stringRepresentation) {
            function xFactory() {
                return Object.create(Object.prototype, {
                    then: {
                        get: function () {
                            throw e;
                        }
                    }
                });
            }

            describe("`e` is " + stringRepresentation, function () {
                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, e);
                        done();
                    });
                });
            });
        }

        Object.keys(reasons).forEach(function (stringRepresentation) {
            testRejectionViaThrowingGetter(reasons[stringRepresentation], stringRepresentation);
        });
    });

    describe("2.3.3.3: If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and " +
             "second argument `rejectPromise`", function () {
        describe("Calls with `x` as `this` and two function arguments", function () {
            function xFactory() {
                var x = {
                    then: function (onFulfilled, onRejected) {
                        assert.strictEqual(this, x);
                        assert.strictEqual(typeof onFulfilled, "function");
                        assert.strictEqual(typeof onRejected, "function");
                        onFulfilled();
                    }
                };
                return x;
            }

            testPromiseResolution(xFactory, function (promise, done) {

                promise.then(function () {
                    done();
                });
            });
        });

        describe("Uses the original value of `then`", function () {
            var numberOfTimesThenWasRetrieved = null;

            beforeEach(function () {
                numberOfTimesThenWasRetrieved = 0;
            });

            function xFactory() {
                return Object.create(Object.prototype, {
                    then: {
                        get: function () {
                            if (numberOfTimesThenWasRetrieved === 0) {
                                return function (onFulfilled) {
                                    onFulfilled();
                                };
                            }
                            return null;
                        }
                    }
                });
            }

            testPromiseResolution(xFactory, function (promise, done) {

                promise.then(function () {
                    done();
                });
            });
        });

        describe("2.3.3.3.1: If/when `resolvePromise` is called with value `y`, run `[[Resolve]](promise, y)`",
                 function () {
            describe("`y` is not a thenable", function () {
                testCallingResolvePromiseFulfillsWith(function () { return undefined; }, "`undefined`", undefined);
                testCallingResolvePromiseFulfillsWith(function () { return null; }, "`null`", null);
                testCallingResolvePromiseFulfillsWith(function () { return false; }, "`false`", false);
                testCallingResolvePromiseFulfillsWith(function () { return 5; }, "`5`", 5);
                testCallingResolvePromiseFulfillsWith(function () { return sentinel; }, "an object", sentinel);
                testCallingResolvePromiseFulfillsWith(function () { return sentinelArray; }, "an array", sentinelArray);
            });

            describe("`y` is a thenable", function () {
                Object.keys(thenables.fulfilled).forEach(function (stringRepresentation) {
                    function yFactory() {
                        return thenables.fulfilled[stringRepresentation](sentinel);
                    }

                    testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, sentinel);
                });

                Object.keys(thenables.rejected).forEach(function (stringRepresentation) {
                    function yFactory() {
                        return thenables.rejected[stringRepresentation](sentinel);
                    }

                    testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, sentinel);
                });
            });

            describe("`y` is a thenable for a thenable", function () {
                Object.keys(thenables.fulfilled).forEach(function (outerStringRepresentation) {
                    var outerThenableFactory = thenables.fulfilled[outerStringRepresentation];

                    Object.keys(thenables.fulfilled).forEach(function (innerStringRepresentation) {
                        var innerThenableFactory = thenables.fulfilled[innerStringRepresentation];

                        var stringRepresentation = outerStringRepresentation + " for " + innerStringRepresentation;

                        function yFactory() {
                            return outerThenableFactory(innerThenableFactory(sentinel));
                        }

                        testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, sentinel);
                    });

                    Object.keys(thenables.rejected).forEach(function (innerStringRepresentation) {
                        var innerThenableFactory = thenables.rejected[innerStringRepresentation];

                        var stringRepresentation = outerStringRepresentation + " for " + innerStringRepresentation;

                        function yFactory() {
                            return outerThenableFactory(innerThenableFactory(sentinel));
                        }

                        testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, sentinel);
                    });
                });
            });
        });

        describe("2.3.3.3.2: If/when `rejectPromise` is called with reason `r`, reject `promise` with `r`",
                 function () {
            Object.keys(reasons).forEach(function (stringRepresentation) {
                testCallingRejectPromiseRejectsWith(reasons[stringRepresentation], stringRepresentation);
            });
        });

        describe("2.3.3.3.3: If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same " +
                 "argument are made, the first call takes precedence, and any further calls are ignored.",
                 function () {
            describe("calling `resolvePromise` then `rejectPromise`, both synchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            resolvePromise(sentinel);
                            rejectPromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` synchronously then `rejectPromise` asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            resolvePromise(sentinel);

                            setTimeout(function () {
                                rejectPromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` then `rejectPromise`, both asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            setTimeout(function () {
                                resolvePromise(sentinel);
                            }, 0);

                            setTimeout(function () {
                                rejectPromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` with an asynchronously-fulfilled promise, then calling " +
                     "`rejectPromise`, both synchronously", function () {
                function xFactory() {
                    var tuple = pending();
                    setTimeout(function () {
                        tuple.fulfill(sentinel);
                    }, 50);

                    return {
                        then: function (resolvePromise, rejectPromise) {
                            resolvePromise(tuple.promise);
                            rejectPromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` with an asynchronously-rejected promise, then calling " +
                     "`rejectPromise`, both synchronously", function () {
                function xFactory() {
                    var tuple = pending();
                    setTimeout(function () {
                        tuple.reject(sentinel);
                    }, 50);

                    return {
                        then: function (resolvePromise, rejectPromise) {
                            resolvePromise(tuple.promise);
                            rejectPromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {
                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` then `resolvePromise`, both synchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            rejectPromise(sentinel);
                            resolvePromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` synchronously then `resolvePromise` asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            rejectPromise(sentinel);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` then `resolvePromise`, both asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            setTimeout(function () {
                                rejectPromise(sentinel);
                            }, 0);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` twice synchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise) {
                            resolvePromise(sentinel);
                            resolvePromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` twice, first synchronously then asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise) {
                            resolvePromise(sentinel);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` twice, both times asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise) {
                            setTimeout(function () {
                                resolvePromise(sentinel);
                            }, 0);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` with an asynchronously-fulfilled promise, then calling it again, both " +
                     "times synchronously", function () {
                function xFactory() {
                    var tuple = pending();
                    setTimeout(function () {
                        tuple.fulfill(sentinel);
                    }, 50);

                    return {
                        then: function (resolvePromise) {
                            resolvePromise(tuple.promise);
                            resolvePromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(function (value) {
                        assert.strictEqual(value, sentinel);
                        done();
                    });
                });
            });

            describe("calling `resolvePromise` with an asynchronously-rejected promise, then calling it again, both " +
                     "times synchronously", function () {
                function xFactory() {
                    var tuple = pending();
                    setTimeout(function () {
                        tuple.reject(sentinel);
                    }, 50);

                    return {
                        then: function (resolvePromise) {
                            resolvePromise(tuple.promise);
                            resolvePromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {

                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` twice synchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            rejectPromise(sentinel);
                            rejectPromise(other);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {
                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` twice, first synchronously then asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            rejectPromise(sentinel);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {
                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("calling `rejectPromise` twice, both times asynchronously", function () {
                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            setTimeout(function () {
                                rejectPromise(sentinel);
                            }, 0);

                            setTimeout(function () {
                                resolvePromise(other);
                            }, 0);
                        }
                    };
                }

                testPromiseResolution(xFactory, function (promise, done) {
                    promise.then(null, function (reason) {
                        assert.strictEqual(reason, sentinel);
                        done();
                    });
                });
            });

            describe("saving and abusing `resolvePromise` and `rejectPromise`", function () {
                var savedResolvePromise, savedRejectPromise;

                function xFactory() {
                    return {
                        then: function (resolvePromise, rejectPromise) {
                            savedResolvePromise = resolvePromise;
                            savedRejectPromise = rejectPromise;
                        }
                    };
                }

                beforeEach(function () {
                    savedResolvePromise = null;
                    savedRejectPromise = null;
                });

                testPromiseResolution(xFactory, function (promise, done) {
                    var timesFulfilled = 0;
                    var timesRejected = 0;

                    promise.then(
                        function () {
                            ++timesFulfilled;
                        },
                        function () {
                            ++timesRejected;
                        }
                    );

                    if (savedResolvePromise && savedRejectPromise) {
                        savedResolvePromise(dummy);
                        savedResolvePromise(dummy);
                        savedRejectPromise(dummy);
                        savedRejectPromise(dummy);
                    }

                    setTimeout(function () {
                        savedResolvePromise(dummy);
                        savedResolvePromise(dummy);
                        savedRejectPromise(dummy);
                        savedRejectPromise(dummy);
                    }, 4);

                    setTimeout(function () {
                        assert.strictEqual(timesFulfilled, 1);
                        assert.strictEqual(timesRejected, 0);
                        done();
                    }, 60);
                });
            });
        });

        describe("2.3.3.3.4: If calling `then` throws an exception `e`,", function () {
            describe("2.3.3.3.4.1: If `resolvePromise` or `rejectPromise` have been called, ignore it.", function () {
                describe("`resolvePromise` was called with a non-thenable", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise) {
                                resolvePromise(sentinel);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(function (value) {
                            assert.strictEqual(value, sentinel);
                            done();
                        });
                    });
                });

                describe("`resolvePromise` was called with an asynchronously-fulfilled promise", function () {
                    function xFactory() {
                        var tuple = pending();
                        setTimeout(function () {
                            tuple.fulfill(sentinel);
                        }, 50);

                        return {
                            then: function (resolvePromise) {
                                resolvePromise(tuple.promise);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(function (value) {
                            assert.strictEqual(value, sentinel);
                            done();
                        });
                    });
                });

                describe("`resolvePromise` was called with an asynchronously-rejected promise", function () {
                    function xFactory() {
                        var tuple = pending();
                        setTimeout(function () {
                            tuple.reject(sentinel);
                        }, 50);

                        return {
                            then: function (resolvePromise) {
                                resolvePromise(tuple.promise);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });

                describe("`rejectPromise` was called", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise, rejectPromise) {
                                rejectPromise(sentinel);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });

                describe("`resolvePromise` then `rejectPromise` were called", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise, rejectPromise) {
                                resolvePromise(sentinel);
                                rejectPromise(other);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(function (value) {
                            assert.strictEqual(value, sentinel);
                            done();
                        });
                    });
                });

                describe("`rejectPromise` then `resolvePromise` were called", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise, rejectPromise) {
                                rejectPromise(sentinel);
                                resolvePromise(other);
                                throw other;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });
            });

            describe("2.3.3.3.4.2: Otherwise, reject `promise` with `e` as the reason.", function () {
                describe("straightforward case", function () {
                    function xFactory() {
                        return {
                            then: function () {
                                throw sentinel;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });

                describe("`resolvePromise` is called asynchronously before the `throw`", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise) {
                                setTimeout(function () {
                                    resolvePromise(other);
                                }, 0);
                                throw sentinel;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });

                describe("`rejectPromise` is called asynchronously before the `throw`", function () {
                    function xFactory() {
                        return {
                            then: function (resolvePromise, rejectPromise) {
                                setTimeout(function () {
                                    rejectPromise(other);
                                }, 0);
                                throw sentinel;
                            }
                        };
                    }

                    testPromiseResolution(xFactory, function (promise, done) {
                        promise.then(null, function (reason) {
                            assert.strictEqual(reason, sentinel);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("2.3.3.4: If `then` is not a function, fulfill promise with `x`", function () {
        function testFulfillViaNonFunction(then, stringRepresentation) {
            var x = null;

            beforeEach(function () {
                x = { then: then };
            });

            function xFactory() {
                return x;
            }

            describe("`then` is " + stringRepresentation, function () {
                testPromiseResolution(xFactory, function (promise, done) {
                    promise.then(function (value) {
                        assert.strictEqual(value, x);
                        done();
                    });
                });
            });
        }

        testFulfillViaNonFunction(5, "`5`");
        testFulfillViaNonFunction({}, "an object");
        testFulfillViaNonFunction([function () { }], "an array containing a function");
        testFulfillViaNonFunction(/a-b/i, "a regular expression");
        testFulfillViaNonFunction(Object.create(Function.prototype), "an object inheriting from `Function.prototype`");



    });
});
