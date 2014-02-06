"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var Promise = adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

function promised(val) {
    return new Promise(function(f) {
        setTimeout(function() {
            f(val);
        }, 4);
    });
}

function thenabled(val) {
    return {
        then: function(f){
            setTimeout(function() {
                f(val);
            }, 4);
        }
    };
}

describe("Promise.prototype.reduce", function() {


    it("should allow returning values", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.reduce(a, function(total, a) {
            return total + a + 5;
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
            done();
        });
    });

    it("should allow returning promises", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.reduce(a, function(total, a) {
            return promised(5).then(function(b) {
                return total + a + b;
            });
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
            done();
        });
    });

    it("should allow returning thenables", function(done) {
        var b = [1,2,3];
        var a = [];

        Promise.reduce(b, function(total, cur) {
            a.push(cur);
            return thenabled(3);
        }, 0).then(function(total){
            assert.equal(total, 3);
            assert.deepEqual(a, b),
            done();
        });
    });

    it("propagates error", function(done) {
        var a = [promised(1), promised(2), promised(3)];
        var e = new Error("asd");
        Promise.reduce(a, function(total, a) {
            if (a > 2) {
                throw e;
            }
            return total + a + 5;
        }, 0).then(assert.fail, function(err) {
            assert.equal(err, e);
            done();
        });
    });

    it("should execute the reduce function on pairs", function(done) {
        var a = [promised(1)];
        var b = [promised(1), promised(2)];
        var c = [promised(1), promised(2), promised(3)];
        var count = function(arr) {
            var count = 0;
            return Promise.reduce(arr, function() { count++; }).
                then(function() { return count; });
        };
        Promise.all([
            count(a).then(function(n) { assert.equal(n, 0); }),
            count(b).then(function(n) { assert.equal(n, 1); }),
            count(c).then(function(n) { assert.equal(n, 2); })
        ]).return().then(done);
    });

    it("should execute the reduce function with initialValue", function(done) {
        var a = [promised(1)];
        var b = [promised(1), promised(2)];
        var c = [promised(1), promised(2), promised(3)];
        var count = function(arr) {
            var count = 0;
            return Promise.reduce(arr, function() { count++; }, 'initialValue').
                then(function() { return count; });
        };
        Promise.all([
            count(a).then(function(n) { assert.equal(n, 1); }),
            count(b).then(function(n) { assert.equal(n, 2); }),
            count(c).then(function(n) { assert.equal(n, 3); })
        ]).return().then(done);
    });

    it("should execute the reduce function when initialValue is undefined", function(done) {
        var a = [promised(1)];
        var b = [promised(1), promised(2)];
        var c = [promised(1), promised(2), promised(3)];
        var count = function(arr, defer) {
            var count = 0;
            var iv = defer ? promised(undefined) : undefined;
            return Promise.reduce(arr, function() { count++; }, iv).
                then(function() { return count; });
        };
        Promise.all([
            count(a).then(function(n) { assert.equal(n, 1); }),
            count(b).then(function(n) { assert.equal(n, 2); }),
            count(c).then(function(n) { assert.equal(n, 3); }),
            count(a, 'defer').then(function(n) { assert.equal(n, 1); }),
            count(b, 'defer').then(function(n) { assert.equal(n, 2); }),
            count(c, 'defer').then(function(n) { assert.equal(n, 3); })
        ]).return().then(done);
    });
});
