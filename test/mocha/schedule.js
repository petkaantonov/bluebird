"use strict";
var assert   = require("assert");
var schedule = require("../../js/debug/schedule");
var isNodeJS = typeof process !== "undefined" && typeof process.execPath === "string";

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
    }
});
