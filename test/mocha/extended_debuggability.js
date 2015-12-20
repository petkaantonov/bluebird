var assert = require("assert");
describe("extended debuggability", function() {

// Extended dubuggability module is optional and off by default,
// so we have to require it explicitly
try {
    require("../../js/debug/extended_debuggability.js")(Promise);
} catch (e) {
    return;
}

function deferAndMarkAsTestPromise() {
    var resolve, reject;
    var promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    promise.test = true;
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

// In this test each promise created should be explicitly marked,
// not to mix it up with promises created by Mocha
describe("promise monitoring", function () {
    function assertPendingPromises(expectedPromisesArray, getPendingPromisesFunctionName) {
        assert(typeof Promise.monitor[getPendingPromisesFunctionName] === "function");
        var allPendingPromises = Promise.monitor[getPendingPromisesFunctionName]();
        // Remove all promises not related to this test
        var i;
        for (i = 0; i < allPendingPromises.length; i++) {
            if (!allPendingPromises[i].test) {
                allPendingPromises.splice(i, 1);
                i--;
            }
        }
        assert(allPendingPromises.length === expectedPromisesArray.length);
        for (i = 0; i < allPendingPromises.length; i++) {
            assert(allPendingPromises[i] === expectedPromisesArray[i]);
        }
    }

    function assertAllAndLeafPendingPromises(expectedPromisesArray) {
        assertPendingPromises(expectedPromisesArray, "getPendingPromises");
        assertPendingPromises(expectedPromisesArray, "getLeafPendingPromises");
    }

    before(function () {
        Promise.config({monitor: true});
    });

    after(function () {
        Promise.config({monitor: false});
        assert(Promise.monitor === null);
    });

    it("promises added to monitor array after creation and removed after resolution", function () {
        var deferred = deferAndMarkAsTestPromise();
        assertAllAndLeafPendingPromises([deferred.promise]);
        var lastPromise = deferred.promise.then(function () {
            assertAllAndLeafPendingPromises([]);
        });
        deferred.resolve();
        return lastPromise;
    });

    it("promises added to monitor array after creation and removed after rejection", function () {
        var deferred = deferAndMarkAsTestPromise();
        assertAllAndLeafPendingPromises([deferred.promise]);
        var lastPromise = deferred.promise.caught(function () {
            assertAllAndLeafPendingPromises([]);
        });
        deferred.reject(new Error("reason"));
        return lastPromise;
    });

    it("promises added to monitor array after creation and removed after direct resolution", function () {
        var deferred = deferAndMarkAsTestPromise();
        assertAllAndLeafPendingPromises([deferred.promise]);
        deferred.resolve();
        var lastPromise = deferred.promise.thenReturn();
        assertAllAndLeafPendingPromises([]);
        return lastPromise;
    });

    it("promises added to monitor array after creation and removed after direct rejection", function () {
        var deferred = deferAndMarkAsTestPromise();
        assertAllAndLeafPendingPromises([deferred.promise]);
        deferred.resolve();
        var lastPromise = deferred.promise.thenThrow(new Error("reason")).caught(function () {
        });
        assertAllAndLeafPendingPromises([]);
        return lastPromise;
    });

    it("leaves of promises chains are calculated correctly", function () {
        // A <- B <- C (Leaf)
        //     /|\
        //      D <- E (Leaf)
        //
        // F <- G (Leaf)
        var Adeferred = deferAndMarkAsTestPromise();
        var A = Adeferred.promise;
        A.test = true;
        var B = A.then(function () {});
        B.test = true;
        var C = B.then(function () {});
        C.test = true;
        var D = B.then(function () {});
        D.test = true;
        var E = D.then(function () {});
        E.test = true;
        var Fdeferred = deferAndMarkAsTestPromise();
        var F = Fdeferred.promise;
        F.test = true;
        var G = F.then(function () {});
        G.test = true;
        assertPendingPromises([A, B, C, D, E, F, G], "getPendingPromises");
        assertPendingPromises([C, E, G], "getLeafPendingPromises");
        var lastPromise = Promise.all([C, E]).then(function () {
            assertPendingPromises([F, G], "getPendingPromises");
            assertPendingPromises([G], "getLeafPendingPromises");
            Fdeferred.reject();
            return G.caught(function () {
                assertPendingPromises([], "getPendingPromises");
                assertPendingPromises([], "getLeafPendingPromises");
            });
        });
        Adeferred.resolve();
        return lastPromise;
    });
});


describe("promises chains length limitation", function () {
    beforeEach(function () {
        Promise.config({maxChainLength: 5});
    });

    it("chain length calculated correctly", function () {
        var A = new Promise.resolve("");
        var B = A.then(function () {});
        var C = B.then(function () {});
        var D = A.then(function () {});
        assert(A._chainLength === 0);
        assert(B._chainLength === 1);
        assert(C._chainLength === 2);
        assert(D._chainLength === 1);
        Promise.config({maxChainLength: false});
        return A;
    });

    it("when chain length limit is reached exception is thrown", function () {
        var exceptionCaught = false;
        var promise = new Promise.resolve("");
        for (var i = 0; i < 5; i++) {
            promise = promise.then(function () {});
        }
        try {
            promise.then(function () {});
        } catch (error) {
            exceptionCaught = true;
            assert(error.message ===
                "Promises chain is too long, it reached limit of 5 promises")
        } finally {
            assert(exceptionCaught === true);
        }
        Promise.config({maxChainLength: false});
        return promise;
    });

    it("when chain length limit is reached hook is called", function () {
        var hookCalled = false;
        Promise.onChainLengthLimitExceeded(function () {
            hookCalled = true;
        });
        var promise = new Promise.resolve("");
        for (var i = 0; i < 5; i++) {
            promise = promise.then(function () {});
        }
        assert(hookCalled === false);
        promise = promise.then(function () {});
        assert(hookCalled === true);
        Promise.config({maxChainLength: false});
        return promise;
    });
});


describe("pending promises number limitation", function () {
    it("when pending promises limit is reached exception is thrown",
        function () {
        Promise.config({maxPendingPromises: 5});
        var exceptionCaught = false;
        var promise = new Promise(function () {});
        for (var i = 0; i < 4; i++) {
            promise = promise.then(function () {});
        }
        try {
            promise.then(function () {});
        } catch (error) {
            exceptionCaught = true;
            assert(error.message ===
                "Too many pending promises, it reached limit of 5 promises");
        } finally {
            assert(exceptionCaught === true);
        }
        Promise.config({maxPendingPromises: false});
    });

    it("when pending promises limit is reached hook is called", function () {
        Promise.config({maxPendingPromises: 5});
        var hookCalled = false;
        Promise.onPendingPromisesLimitExceeded(function () {
            hookCalled = true;
        });
        var promise = new Promise(function () {});
        for (var i = 0; i < 4; i++) {
            promise = promise.then(function () {});
        }
        assert(hookCalled === false);
        promise.then(function () {});
        assert(hookCalled === true);
        Promise.config({maxPendingPromises: false});
    });
});

describe("tracing", function () {
        before(function() {
            Promise.config({tracing: true});
        });

        after(function() {
            Promise.config({tracing: false});
        });

        it("DOT graph matches promises state and number", function () {
            // A <- B <- C
            //     /|\
            //      D <- E
            var edges = /[0-9]+->[0-9]+;/g;
            var nodes = /[0-9]+\[label=.*at extended_debuggability.js:[0-9]+:[0-9]+.*,color=red];/g;
            var A = new Promise(function (){});
            var B = A.then(function () {});
            var C = B.then(function () {});
            var D = B.then(function () {});
            var E = D.then(function () {});
            var graph = B.getDOTGraph();
            assert(graph.indexOf("digraph promises {") === 0);
            assert(graph.match(edges).length === 4);
            assert(graph.match(nodes).length === 5);
        });
    });
});
