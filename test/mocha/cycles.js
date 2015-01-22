"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

var helpers = require("./helpers/testThreeCases.js");
var TypeError = Promise.TypeError;

function passthru(fn) {
    return function() {
        fn();
    };
}

describe("Cyclical promises should throw TypeError when", function(){
    describe("returning from fulfill", function() {
        helpers.testFulfilled(3, function(promise, done) {
            var self = promise.then(function() {
                return self;
            });

            self.caught(TypeError, passthru(done));
        });
    });

    describe("returning from reject", function() {
        helpers.testRejected(3, function(promise, done) {
            var self = promise.caught(function() {
                return self;
            });

            self.caught(TypeError, passthru(done));
        });
    });

    describe("fulfill with itself when using a ", function() {
        specify("deferred", function(done) {
            var d = Promise.defer();
            d.fulfill(d.promise);
            d.promise.caught(TypeError, passthru(done));
        });

        specify("constructor", function(done) {
            var resolve;
            var p = new Promise(function(r) {
                resolve = r;
            });
            resolve(p);
            p.caught(TypeError, passthru(done));
        });
    });

    describe("reject with itself when using a ", function() {
        specify("deferred", function(done) {
            var d = Promise.defer();
            d.reject(d.promise);
            d.promise.caught(TypeError, passthru(done));
        });

        specify("constructor", function(done) {
            var reject;
            var p = new Promise(function(f, r) {
                reject = r;
            });
            reject(p);
            p.caught(TypeError, passthru(done));
        });
    });
});
