"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");


describe("tap", function () {
    specify("passes through value", function() {
        return Promise.resolve("test").tap(function() {
            return 3;
        }).then(function(value){
            assert.equal(value, "test");
        });
    });

    specify("passes through value after returned promise is fulfilled", function() {
        var async = false;
        return Promise.resolve("test").tap(function() {
            return new Promise(function(r) {
                setTimeout(function(){
                    async = true;
                    r(3);
                }, 1);
            });
        }).then(function(value){
            assert(async);
            assert.equal(value, "test");
        });
    });

    specify("is not called on rejected promise", function() {
        var called = false;
        return Promise.reject("test").tap(function() {
            called = true;
        }).then(assert.fail, function(value){
            assert(!called);
        });
    });

    specify("passes immediate rejection", function() {
        var err = new Error();
        return Promise.resolve("test").tap(function() {
            throw err;
        }).tap(assert.fail).then(assert.fail, function(e){
            assert(err === e);
        });
    });

    specify("passes eventual rejection", function() {
        var err = new Error();
        return Promise.resolve("test").tap(function() {
            return new Promise(function(_, rej) {
                setTimeout(function(){
                    rej(err);
                }, 1)
            });
        }).tap(assert.fail).then(assert.fail, function(e) {
            assert(err === e);
        });
    });

    specify("passes value", function() {
        return Promise.resolve(123).tap(function(a) {
            assert(a === 123);
        });
    });
});
