"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

var helpers = require("./helpers/testThreeCases.js");
var TypeError = Promise.TypeError;


describe("Cyclical promises should throw TypeError when", function(){
    describe("returning from fulfill", function() {
        helpers.testFulfilled(3, function(promise) {
            var self = promise.then(function() {
                return self;
            });

            return self.then(assert.fail).caught(TypeError, testUtils.noop);
        });
    });

    describe("returning from reject", function() {
        helpers.testRejected(3, function(promise) {
            var self = promise.then(assert.fail, function() {
                return self;
            });

            return self.then(assert.fail).caught(TypeError, testUtils.noop);
        });
    });

    describe("fulfill with itself when using a ", function() {
        specify("deferred", function() {
            var d = Promise.defer();
            d.fulfill(d.promise);
            return d.promise.then(assert.fail).caught(TypeError, testUtils.noop);
        });

        specify("constructor", function() {
            var resolve;
            var p = new Promise(function(r) {
                resolve = r;
            });
            resolve(p);
            return p.then(assert.fail).caught(TypeError, testUtils.noop);
        });
    });

    describe("reject with itself when using a ", function() {
        specify("deferred", function() {
            var d = Promise.defer();
            d.reject(d.promise);
            return d.promise.then(assert.fail).caught(function(v) {
                assert.equal(d.promise, v);
            });
        });

        specify("constructor", function() {
            var reject;
            var p = new Promise(function(f, r) {
                reject = r;
            });
            reject(p);
            return p.then(assert.fail).caught(function(v) {
                assert.equal(p, v);
            });
        });
    });
});
