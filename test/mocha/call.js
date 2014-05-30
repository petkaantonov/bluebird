"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var c = {
    val: 3,
    method: function() {
        return [].slice.call(arguments).concat(this.val);
    }
};

describe("call", function() {
    specify("0 args", function(done) {
        Promise.resolve(c).call("method").then(function(res) {
            assert.deepEqual([3], res);
            done();
        });
    });
    specify("1 args", function(done) {
        Promise.resolve(c).call("method", 1).then(function(res) {
            assert.deepEqual([1, 3], res);
            done();
        });
    });
    specify("2 args", function(done) {
        Promise.resolve(c).call("method", 1, 2).then(function(res) {
            assert.deepEqual([1, 2, 3], res);
            done();
        });
    });
    specify("3 args", function(done) {
        Promise.resolve(c).call("method", 1, 2, 3).then(function(res) {
            assert.deepEqual([1, 2, 3, 3], res);
            done();
        });
    });
    specify("10 args", function(done) {
        Promise.resolve(c).call("method", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10).then(function(res) {
            assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 3], res);
            done();
        });
    });
})
