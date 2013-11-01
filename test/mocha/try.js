"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var obj = {};
var error = new Error();
var thrower = function() {
    throw error;
};

var identity = function(val) {
    return val;
};

var array = function() {
    return [].slice.call(arguments);
};

var receiver = function() {
    return this;
};

var tryy = Promise["try"];

describe("Promise.try", function(){
    specify("should reject when the function throws", function(done) {
        var async = false;
        tryy(thrower).then(assert.fail, function(e) {
            assert(async);
            assert(e === error);
            done();
        });
        async = true;
    });
    specify("should reject when the function is not a function", function(done) {
        var async = false;
        tryy(null).then(assert.fail, function(e) {
            assert(async);
            assert(e instanceof Promise.TypeError);
            done();
        });
        async = true;
    });
    specify("should call the function with the given receiver", function(done){
        var async = false;
        tryy(receiver, void 0, obj).then(function(val) {
            assert(async);
            assert(val === obj);
            done();
        }, assert.fail);
        async = true;
    });
    specify("should call the function with the given value", function(done){
        var async = false;
        tryy(identity, obj).then(function(val) {
            assert(async);
            assert(val === obj);
            done();
        }, assert.fail);
        async = true;
    });
    specify("should apply the function if given value is array", function(done){
        var async = false;
        tryy(array, [1,2,3]).then(function(val) {
            assert(async);
            assert.deepEqual(val, [1,2,3]);
            done();
        }, assert.fail);
        async = true;
    });

    specify("should unwrap returned promise", function(done){
        var d = Promise.pending();

        tryy(function(){
            return d.promise;
        }).then(function(v){
            assert(v === 3);
            done();
        })

        setTimeout(function(){
            d.fulfill(3);
        }, 13);
    });
    specify("should unwrap returned thenable", function(done){

        tryy(function(){
            return {
                then: function(f, v) {
                    f(3);
                }
            }
        }).then(function(v){
            assert(v === 3);
            done();
        });
    });
});
