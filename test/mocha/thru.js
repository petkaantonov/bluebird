"use strict";
var assert = require("assert");

describe("thru", function () {
    specify("passes through promise", function() {
        var orig = Promise.resolve("test");
        return orig.thru(function(p) {
            assert.equal(p, orig);
        });
    });

    specify("passes through function return", function() {
        var orig = Promise.resolve("test");
        var p = orig.thru(function(p) {
            return p;
        });
        return p.then(function() {
            assert.equal(p, orig);
        });
    });
});
