"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var schedule = require("../../js/debug/schedule");
var isNodeJS = testUtils.isNodeJS;

describe("schedule", function () {
    if (isNodeJS) {
        describe("for Node.js", function () {
            it("should preserve the active domain", function (done) {
                var domain       = require("domain");
                var activeDomain = domain.create();

                activeDomain.run(function () {
                    schedule(function () {
                        assert(domain.active);
                        assert.equal(domain.active, activeDomain);

                        done();
                    });
                });
            });
        });

        describe("Promise.setScheduler", function() {
            it("should work with synchronous scheduler", function(done) {
                Promise.setScheduler(function(task) {
                    task();
                });
                var success = false;
                Promise.resolve().then(function() {
                    success = true;
                });
                assert(success);
                done();
            });
            it("should throw for non function", function(done) {
                try {
                    Promise.setScheduler({});
                } catch (e) {
                    done();
                }
            });
        });
    }
});
