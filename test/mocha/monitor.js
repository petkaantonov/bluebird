var assert = require("assert");

// In this test each promise created in this test should be explicitly marked,
// not to mix it up with promises created by Mocha

describe("promise monitoring", function() {

	function assertPendingPromises(expectedPromisesArray, getPendingPromisesFunctionName) {
		assert(typeof Promise.monitor[getPendingPromisesFunctionName] === "function");
		var allPendingPromises = Promise.monitor[getPendingPromisesFunctionName]();
		// Remove all promises not related to this test
		var i;
		for (i = 0; i < allPendingPromises.length; i++) {
			if (!allPendingPromises[i].test) {
				allPendingPromises.splice(i,1);
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

	function deferAndMarkAsTestPromise() {
		var resolve, reject;
		var promise = new Promise(function() {
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

    before(function() {
        Promise.config({monitor: true});
    });

    after(function() {
        Promise.config({monitor: false});
        assert(Promise.monitor === null);
    });

	it("promises added to monitor array after creation and removed after resolution", function() {
		var deferred = deferAndMarkAsTestPromise();
		assertAllAndLeafPendingPromises([deferred.promise]);
		var lastPromise = deferred.promise.then(function() {
			assertAllAndLeafPendingPromises([]);
		});
		deferred.resolve();
		return lastPromise;
	});

	it("promises added to monitor array after creation and removed after rejection", function() {
		var deferred = deferAndMarkAsTestPromise();
		assertAllAndLeafPendingPromises([deferred.promise]);
		var lastPromise = deferred.promise.catch(function() {
			assertAllAndLeafPendingPromises([]);
		});
		deferred.reject(new Error("reason"));
		return lastPromise;
	});

	it("promises added to monitor array after creation and removed after direct resolution", function() {
		var deferred = deferAndMarkAsTestPromise();
		assertAllAndLeafPendingPromises([deferred.promise]);
		deferred.resolve();
		var lastPromise = deferred.promise.thenReturn();
		assertAllAndLeafPendingPromises([]);
		return lastPromise;
	});

	it("promises added to monitor array after creation and removed after direct rejection", function() {
		var deferred = deferAndMarkAsTestPromise();
		assertAllAndLeafPendingPromises([deferred.promise]);
		deferred.resolve();
		var lastPromise = deferred.promise.thenThrow(new Error("reason")).catch(function (){});
		assertAllAndLeafPendingPromises([]);
		return lastPromise;
	});

	it("leaves of promises chains are calculated correctly", function() {
		// A <- B <- C (Leaf)
		//     /|\
		//      D <- E (Leaf)
		//
		// F <- G (Leaf)
		var Adeferred = deferAndMarkAsTestPromise();
		var A = Adeferred.promise;
		A.test = true;
		var B = A.then(function() {});
		B.test = true;
		var C = B.then(function() {});
		C.test = true;
		var D = B.then(function() {});
		D.test = true;
		var E = D.then(function() {});
		E.test = true;
		var Fdeferred = deferAndMarkAsTestPromise();
		var F = Fdeferred.promise;
		F.test = true;
		var G = F.then(function() {});
		G.test = true;

		assertPendingPromises([A, B, C, D, E, F, G], "getPendingPromises");
		assertPendingPromises([C, E, G], "getLeafPendingPromises");

		var lastPromise = Promise.all([C, E]).then(function() {
			assertPendingPromises([F, G], "getPendingPromises");
			assertPendingPromises([G], "getLeafPendingPromises");
            Fdeferred.reject();
			return G.catch(function() {
				assertPendingPromises([], "getPendingPromises");
				assertPendingPromises([], "getLeafPendingPromises");
			});
		});
		Adeferred.resolve();
		return lastPromise;
	});
});
