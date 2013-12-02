"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;


describe("Promise.some", function(){
    it("should reject on negative number", function(done){
        Promise.some([1,2,3], -1)
            .then(assert.fail)
            .caught(Promise.TypeError, function(){
                done();
            });
    });

    it("should reject on NaN", function(done){
        Promise.some([1,2,3], -0/0)
            .then(assert.fail)
            .caught(Promise.TypeError, function(){
                done();
            });
    });

    it("should reject on non-array", function(done){
        Promise.some({}, 2)
            .then(assert.fail)
            .caught(Promise.TypeError, function(){
                done();
            });
    });

    it("should reject with rangeerror when impossible to fulfill", function(done){
        Promise.some([1,2,3], 4)
            .then(assert.fail)
            .caught(Promise.RangeError, function(e){
                done();
            });
    });

    it("should fulfill with empty array with 0", function(done){
        Promise.some([1,2,3], 0).then(function(result){
            assert.deepEqual(result, []);
            done();
        });
    });
});
