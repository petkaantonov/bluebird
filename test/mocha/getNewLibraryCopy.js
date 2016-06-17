"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.getNewLibraryCopy", function() {
    it("should return an independent copy of Bluebird library", function() {
        var Promise2 = Promise.getNewLibraryCopy();
        Promise2.x = 123;

        assert.equal(typeof Promise2.prototype.then, "function");
        assert.notEqual(Promise2, Promise);

        assert.equal(Promise2.x, 123);
        assert.notEqual(Promise.x, 123);
    });
    it("should return copy of Bluebird library with its own getNewLibraryCopy method", function() {
        var Promise2 = Promise.getNewLibraryCopy();
        var Promise3 = Promise2.getNewLibraryCopy();
        Promise3.x = 123;

        assert.equal(typeof Promise3.prototype.then, "function");
        assert.notEqual(Promise3, Promise);
        assert.notEqual(Promise3, Promise2);

        assert.equal(Promise3.x, 123);
        assert.notEqual(Promise.x, 123);
        assert.notEqual(Promise2.x, 123);
    });
});
