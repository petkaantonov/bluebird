"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var join = Promise.join;

describe("indexed getter", function() {
    var p = Promise.resolve([0, 1, 2, 3, 4, 5, 7, 5,10]);
    specify("gets positive index", function() {
        var first = p.get(0);
        var fourth = p.get(3);
        var last = p.get(8);

        return join(first, fourth, last, function(a, b, c) {
            assert(a === 0);
            assert(b === 3);
            assert(c === 10);
        });
    });

    specify("gets negative index", function() {
        var last = p.get(-1);
        var first = p.get(-20);

        return join(last, first, function(a, b) {
            assert.equal(a, 10);
            assert.equal(b, 0);
        });
    });
});

describe("identifier getter", function() {
    var p = Promise.resolve(new RegExp("", ""));
    specify("gets property", function() {
        var ci = p.get("ignoreCase");
        var g = p.get("global");
        var lastIndex = p.get("lastIndex");
        var multiline = p.get("multiline");

        return join(ci, g, lastIndex, multiline, function(ci, g, lastIndex, multiline) {
            assert(ci === false);
            assert(g === false);
            assert(lastIndex === 0);
            assert(multiline === false);
        });
    });

    specify("gets same property", function() {
        var o = {o: 1};
        var o2 = {o: 2};
        o = Promise.resolve(o).get("o");
        o2 = Promise.resolve(o2).get("o");
        return join(o, o2, function(one, two) {
            assert.strictEqual(1, one);
            assert.strictEqual(2, two);
        });
    });
});

describe("non identifier getters", function() {
    var p = Promise.resolve({"-": "val"});
    specify("get property", function() {
        return p.get("-").then(function(val) {
            assert(val === "val");
        });
    });

    specify.skip("overflow cache", function() {
        var a = new Array(1024);
        var o = {};
        for (var i = 0; i < a.length; ++i) {
            a[i] = "get" + i;
            o["get" + i] = i*2;
        }
        var b = Promise.map(a, function(item, index) {
            return Promise.resolve(o).get(a[index]);
        }).filter(function(value, index) {
            return value === index * 2;
        }).then(function(values) {
            assert.strictEqual(values.length, a.length);
        });
        return b;
    });
});
