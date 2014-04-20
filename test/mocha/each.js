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

function thenabled(val, arr) {
    return {
        then: function(f){
            setTimeout(function() {
                if (arr) arr.push(val);
                f(val);
            }, 4);
        }
    };
}

describe("Promise.prototype.each", function() {


    it("should return the array's values", function(done) {
        var a = [promised(1), promised(2), promised(3)];
        var b = [];
        Promise.each(a, function(val) {
            b.push(3-val);
            return val;
        }).then(function(ret) {
            assert.deepEqual(ret, [1,2,3]);
            assert.deepEqual(b, [2, 1, 0]);
            done();
        });
    });


    it("takes value, index and length", function(done) {
        var a = [promised(1), promised(2), promised(3)];
        var b = [];
        Promise.each(a, function(value, index, length) {
            b.push(value, index, length);
        }).then(function(ret) {
            assert.deepEqual(b, [1, 0, 3, 2, 1, 3, 3, 2, 3]);
            done();
        });
    });

    it("waits for returned promise before proceeding next", function(done) {
        var a = [promised(1), promised(2), promised(3)];
        var b = [];
        Promise.each(a, function(value) {
            b.push(value);
            return Promise.delay(10).then(function(){
                b.push(value*2);
            });
        }).then(function(ret) {
            assert.deepEqual(b, [1,2,2,4,3,6]);
            done();
        });
    });

    it("waits for returned thenable before proceeding next", function(done) {
        var b = [1, 2, 3];
        var a = [thenabled(1), thenabled(2), thenabled(3)];
        Promise.each(a, function(val) {
            b.push(val * 50);
            return thenabled(val * 500, b);
        }).then(function(ret) {
            assert.deepEqual(b, [1, 2, 3, 50, 500, 100, 1000, 150, 1500]);
            done();
        });
    });

    it("doesnt iterate with an empty array", function(done) {
        Promise.each([], function(val) {
            throw new Error();
        }).then(function(ret) {
            assert.deepEqual(ret, []);
            done();
        });
    });

    it("iterates with an array of single item", function(done) {
        var b = [];
        Promise.each([promised(1)], function(val) {
            b.push(val);
            return thenabled(val*2, b);
        }).then(function(ret) {
            assert.deepEqual(b, [1,2]);
            done();
        });
    });
});
