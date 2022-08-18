"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


describe("Async requirement", function() {

    var arr = [];

    function a() {
        arr.push(1);
    }

    function b() {
        arr.push(2);
    }

    function c() {
        arr.push(3);
    }


    function assertArr() {
        assert.deepEqual(arr, [1,2,3]);
        arr.length = 0;
    }

    beforeEach(function() {
        arr = [];
    });

    specify("Basic", function() {
        var p = new Promise(function(resolve) {
            resolve();
        });
        a();
        p.then(c);
        b();
        return p.then(assertArr);
    });

    specify("Resolve-Before-Then", function() {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        resolveP();
        p.then(c);
        b();
        return p.then(assertArr);
    });

    specify("Resolve-After-Then", function() {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        p.then(c);
        resolveP();
        b();
        return p.then(assertArr);
    });

    specify("Then-Inside-Then", function() {
        var fulfilledP = Promise.resolve();
        return fulfilledP.then(function() {
            a();
            var ret = fulfilledP.then(c).then(assertArr);
            b();
            return ret;
        });
    });

    if (typeof Error.captureStackTrace === "function") {
        describe("Should not grow the stack and cause eventually stack overflow.", function(){
            var lim;
            beforeEach(function() {
                lim = Error.stackTraceLimit;
                Error.stackTraceLimit = 10000;
            });

            afterEach(function() {
                Error.stackTraceLimit = lim;
            });

            function assertStackIsNotGrowing(stack) {
                assert(stack.split("\n").length > 5);
                assert(stack.split("\n").length < 15);
            }

            specify("Already fulfilled.", function() {
                function test(i){
                    if (i <= 0){
                       return Promise.resolve(new Error().stack);
                   } else {
                       return Promise.resolve(i-1).then(test)
                   }
                }
                return test(100).then(function(stack) {
                    assertStackIsNotGrowing(stack);
                });
            });

            specify("Already rejected", function() {
                function test(i){
                    if (i <= 0){
                       return Promise.reject(new Error().stack);
                   } else {
                       return Promise.reject(i-1).then(assert.fail, test)
                   }
                }
                return test(100).then(assert.fail, function(stack) {
                    assertStackIsNotGrowing(stack);
                });
            });

            specify("Immediately fulfilled", function() {
                function test(i){
                    var deferred = Promise.defer();
                    if (i <= 0){
                       deferred.fulfill(new Error().stack);
                       return deferred.promise;
                   } else {
                       deferred.fulfill(i-1);
                       return deferred.promise.then(test)
                   }
                }
                return test(100).then(function(stack) {
                    assertStackIsNotGrowing(stack);
                });
            });

            specify("Immediately rejected", function() {
                function test(i){
                    var deferred = Promise.defer();
                    if (i <= 0){
                       deferred.reject(new Error().stack);
                       return deferred.promise;
                   } else {
                       deferred.reject(i-1);
                       return deferred.promise.then(assert.fail, test)
                   }
                }
                return test(10).then(assert.fail, function(stack) {
                    assertStackIsNotGrowing(stack);
                });
            });
        });
    }

    if (testUtils.isRecentNode) {
        describe("Frees memory of old values in promise chains", function () {
            function getHeapUsed() {
                global.gc();
                return process.memoryUsage().heapUsed;
            }

            var initialHeapUsed;

            before(function () {
                if (typeof global.gc !== "function") {
                    throw new Error("These tests require the --expose-gc flag");
                }
                initialHeapUsed = getHeapUsed();
            });

            specify(".then", function () {
                return Promise.resolve()
                    .then(function () {
                        assert.ok(
                            getHeapUsed() < initialHeapUsed * 1.1,
                            "Promise.resolve uses minimal memory"
                        );
                        var rows = [];
                        for (var i = 0; i < 1e6; i++) {
                            rows.push(["Example " + i, i, i * 2]);
                        }
                        return rows;
                    })
                    .then(function (rows) {
                        assert.ok(
                            getHeapUsed() > initialHeapUsed * 12,
                            "large array uses a large amount of memory"
                        );
                        return { len: rows.length };
                    })
                    .then(function (x) {
                        // work around cancellation retaining previous result
                        return x;
                    })
                    .then(function (summaryResult) {
                        assert.ok(
                            getHeapUsed() < initialHeapUsed * 1.1,
                            "memory used by large array is freed"
                        );
                        assert.strictEqual(summaryResult.len, 1e6, "result");
                    });
            });

            specify(".catch", function () {
                return Promise.reject(new Error("error 1"))
                    .catch(function () {
                        assert.ok(
                            getHeapUsed() < initialHeapUsed * 1.1,
                            "Promise.reject uses minimal memory"
                        );
                        var rows = [];
                        for (var i = 0; i < 1e6; i++) {
                            rows.push(["Example " + i, i, i * 2]);
                        }
                        var error = new Error("error 2");
                        error.result = rows;
                        throw error;
                    })
                    .catch(function (err) {
                        assert.ok(
                            getHeapUsed() > initialHeapUsed * 12,
                            "large array uses a large amount of memory"
                        );
                        var rows = err.result;
                        var error = new Error("error 3");
                        error.result = { len: rows.length };
                        throw error;
                    })
                    .catch(function (err) {
                        // work around cancellation retaining previous result
                        throw err;
                    })
                    .catch(function (err) {
                        assert.ok(
                            getHeapUsed() < initialHeapUsed * 1.1,
                            "memory used by large array is freed"
                        );
                        var summaryResult = err.result;
                        assert.strictEqual(summaryResult.len, 1e6, "result");
                    });
            });
        });
    }
});
