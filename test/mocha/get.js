"use strict";
var assert = require("assert");
var Promise= require("../../js/debug/bluebird.js");
var join = Promise.join;

describe("indexed getter", function() {
    var p = Promise.resolve([0, 1, 2, 3, 4, 5, 7, 5,10]);
    specify("gets index", function(done) {
        var first = p.get(0);
        var fourth = p.get(3);
        var last = p.get(8);

        join(first, fourth, last, function(a, b, c) {
            assert(a === 0);
            assert(b === 3);
            assert(c === 10);
            done();
        });
    });
});

describe("identifier getter", function() {
    var p = Promise.resolve(new RegExp("", ""));
    specify("gets property", function(done) {
        var ci = p.get("ignoreCase");
        var g = p.get("global");
        var lastIndex = p.get("lastIndex");
        var multiline = p.get("multiline");

        join(ci, g, lastIndex, multiline, function(ci, g, lastIndex, multiline) {
            assert(ci === false);
            assert(g === false);
            assert(lastIndex === 0);
            assert(multiline === false);
            done();
        });
    });
});

describe("non identifier getter", function() {
    var p = Promise.resolve({"-": "val"});
    specify("gets property", function(done) {
        p.get("-").then(function(val) {
            assert(val === "val");
            done();
        });
    });
});
