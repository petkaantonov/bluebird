"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


describe("Using deferreds", function() {
    describe("a promise A that is following a promise B", function() {
        specify("Must not react to fulfill/reject/ that don't come from promise B", function() {
            var deferred = Promise.defer();
            var promiseA = deferred.promise;
            var promiseB = Promise.defer().promise;
            var called = 0;
            function incrementCalled() {
                called++;
            }

            promiseA.then(
                incrementCalled,
                incrementCalled
            );
            deferred.fulfill(promiseB);

            deferred.fulfill(1);
            deferred.reject(1);
            return Promise.delay(1).then(function() {
                assert.equal(0, called);
                assert.equal(promiseA.isPending(), true);
                assert.equal(promiseB.isPending(), true);
            });
        });

        specify("Must not start following another promise C", function() {
            var deferred = Promise.defer();
            var promiseA = deferred.promise;
            var promiseB = Promise.defer().promise;
            var deferredC = Promise.defer();
            var promiseC = deferredC.promise;
            var called = 0;
            function incrementCalled() {
                called++;
            }


            promiseA.then(
                incrementCalled,
                incrementCalled
            );
            deferred.fulfill(promiseB);
            deferred.fulfill(promiseC);

            deferredC.fulfill(1);
            deferredC.reject(1);

            return promiseC.then(function() {
                assert.equal(called, 0);
                assert.equal(promiseA.isPending(), true);
                assert.equal(promiseB.isPending(), true);
                assert.equal(promiseC.isPending(), false);
            });
        });

        specify("Must react to fulfill/reject that come from promise B", function() {
            var deferred = Promise.defer();
            var promiseA = deferred.promise;
            var deferredFollowee = Promise.defer();
            var promiseB = deferredFollowee.promise;
            var called = 0;
            function incrementCalled() {
                called++;
            }
            var c = 0;

            var ret = promiseA.then(function(v){
                c++;
                assert.equal(c, 1);
                assert.equal(called, 0);
            }, incrementCalled);

            deferred.fulfill(promiseB);


            deferredFollowee.fulfill(1);
            deferredFollowee.reject(1);
            return ret;
        });
    });
});

describe("Using static immediate methods", function() {
    describe("a promise A that is following a promise B", function() {
        specify("Should be instantly fulfilled with Bs fulfillment value if B was fulfilled", function() {
            var val = {};
            var B = Promise.resolve(val);
            var A = Promise.resolve(B);
            assert.equal(A.value(), val);
            assert.equal(A.value(), B.value());
        });

        specify("Should be instantly fulfilled with Bs parent fulfillment value if B was fulfilled with a parent", function() {
            var val = {};
            var parent = Promise.resolve(val);
            var B = Promise.resolve(parent);
            var A = Promise.resolve(B);
            assert.equal(A.value(), val);
            assert.equal(A.value(), B.value());
            assert.equal(A.value(), parent.value());
        });
    });

    describe("Rejecting a promise A with promise B", function(){
        specify("Should reject promise A with B as reason ", function() {
            var val = {};
            var B = Promise.resolve(val);
            var A = Promise.reject(B);
            assert.equal(A.reason(), B);
            A.then(assert.fail, function(){});
        });
    });
});

describe("Using constructor", function() {
    describe("a promise A that is following a promise B", function() {
        specify("Must not react to fulfill/reject that don't come from promise B", function() {
            var resolveA;
            var rejectA;
            var promiseA = new Promise(function() {
                resolveA = arguments[0];
                rejectA = arguments[1];
            });
            var promiseB = new Promise(function(){});
            var called = 0;
            function incrementCalled() {
                called++;
            }

            promiseA.then(
                incrementCalled,
                incrementCalled
            );

            resolveA(promiseB);
            resolveA(1);
            rejectA(1);
            return Promise.delay(1).then(function() {
                assert.equal(0, called);
                assert.equal(promiseA.isPending(), true);
                assert.equal(promiseB.isPending(), true);
            });
        });

        specify("Must not start following another promise C", function() {
            var resolveA;
            var promiseA = new Promise(function(){
                resolveA = arguments[0];
            });
            var promiseB = new Promise(function(){});
            var resolveC, rejectC;
            var promiseC = new Promise(function(){
                resolveC = arguments[0];
                rejectC = arguments[1];
            });
            var called = 0;
            function incrementCalled() {
                called++;
            }

            promiseA.then(
                incrementCalled,
                incrementCalled,
                incrementCalled
            );
            resolveA(promiseB);
            resolveA(promiseC);
            resolveC(1);
            rejectC(1);
            return promiseC.then(function() {
                assert.equal(called, 0);
                assert.equal(promiseA.isPending(), true);
                assert.equal(promiseB.isPending(), true);
                assert.equal(promiseC.isPending(), false);
            });
        });
    });
});
