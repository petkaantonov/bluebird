"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var Promise = adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

describe("tap", function () {
    specify("passes through value", function(done) {
        Promise.resolve("test").tap(function() {
            return 3;
        }).then(function(value){
            assert.equal(value, "test");
            done();
        });
    });

    specify("passes through value after returned promise is fulfilled", function(done) {
        var async = false;
        Promise.resolve("test").tap(function() {
            return new Promise(function(r) {
                setTimeout(function(){
                    async = true;
                    r(3);
                }, 13);
            });
        }).then(function(value){
            assert(async);
            assert.equal(value, "test");
            done();
        });
    });

    specify("is not called on rejected promise", function(done) {
        var called = false;
        Promise.reject("test").tap(function() {
            called = true;
        }).caught(function(value){
            assert(!called);
            done();
        });
    });

    specify("passes immediate rejection", function(done) {
        var err = new Error();
        Promise.resolve("test").tap(function() {
            throw err;
        }).tap(assert.fail).caught(function(e){
            assert(err === e);
            done();
        });
    });

    specify("passes eventual rejection", function(done) {
        var err = new Error();
        Promise.resolve("test").tap(function() {
            return new Promise(function(_, rej) {
                setTimeout(function(){
                    rej(err);
                }, 13)
            });
        }).tap(assert.fail).caught(function(e) {
            assert(err === e);
            done();
        });
    });
});
