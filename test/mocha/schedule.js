"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var schedule = require("../../js/debug/schedule");
var isNodeJS = testUtils.isNodeJS;

describe("schedule", function () {
    if (isNodeJS) {
        describe("for Node.js", function () {
            it("should preserve the active domain", function() {
                var domain       = require("domain");
                var activeDomain = domain.create();
                return new Promise(function(resolve) {
                    activeDomain.run(function () {
                        schedule(function () {
                            assert(domain.active);
                            assert.equal(domain.active, activeDomain);
                            resolve();
                        });
                    });
                });

            });
        });

        describe("Promise.setScheduler", function() {
            it("should work with synchronous scheduler", function() {
                var prev = Promise.setScheduler(function(task) {
                    task();
                });
                var success = false;
                Promise.resolve().then(function() {
                    success = true;
                });
                assert(success);
                Promise.setScheduler(prev);
            });
            it("should throw for non function", function() {
                try {
                    Promise.setScheduler({});
                } catch (e) {
                    return Promise.resolve();
                }
                assert.fail();
            });
        });
    }
});
