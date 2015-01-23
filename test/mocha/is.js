"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.is", function() {
    it("should return true for trusted promise", function() {
        assert.strictEqual(Promise.is(new Promise(function(){})), true);
    });
    it("should return false for untrusted promise", function() {
        assert.strictEqual(Promise.is({
            then: function() {}
        }), false);
    });
});
