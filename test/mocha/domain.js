"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

if (testUtils.isRecentNode) {
    describe("domain", function() {
        afterEach(function() {
            Promise.onPossiblyUnhandledRejection(null);
        });
        specify("gh-148", function() {
            var called = false;
            var e = new Error();
            Promise.resolve(23).then(function(){called = true});
            return testUtils.awaitDomainException(function(E) {
                assert.equal(e, E);
                assert(called);
            }, function() {
                Promise.onPossiblyUnhandledRejection(function(error) {
                    throw error;
                });
                var P = new Promise(function(_, reject){reject(e);});
            });
        });
    });
}
