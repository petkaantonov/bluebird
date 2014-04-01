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

describe("Promise.prototype.each", function() {


    it("should allow returning values", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.each(a, function(val) {
            return val;
        }).then(function(ret) {
            assert.deepEqual(ret, [1,2,3]);
            done();
        });
    });


    it("takes the previously returned value", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.each(a, function(val, prevVal, index) {
            if (index > 0) return val+prevVal;
            return val;
        }).then(function(ret) {
            assert.deepEqual(ret, [1,3,6]);
            done();
        });
    });

    it("should allow returning promises", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.each(a, function(val) {
            return promised(5).then(function(v) {
                return v + val;
            });
        }).then(function(ret) {
            assert.deepEqual(ret, [6,7,8]);
            done();
        });
    });


    it("takes the previously returned promise as value", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.each(a, function(val, prevVal, index) {
            if (index > 0) return promised(5).then(function(v) {
                                return v + val + prevVal;
                            });
            return promised(5).then(function(v) {
                return val + v;
            });
        }).then(function(ret) {
            assert.deepEqual(ret, [6, 13, 21]);
            done();
        });
    });

    it("should allow returning thenables", function(done) {
        var a = [thenabled(1), thenabled(2), thenabled(3)];

        Promise.each(a, function(val) {
            return thenabled(5);
        }).then(function(ret) {
            assert.deepEqual(ret, [5, 5, 5]);
            done();
        });
    });
});
