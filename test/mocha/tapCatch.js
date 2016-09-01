"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
function rejection() {
    var error = new Error("test");
    var rejection = Promise.reject(error);
    rejection.err = error;
    return rejection;
}

describe("tapError", function () {

    specify("passes through rejection reason", function() {
        return rejection().tapError(function() {
            return 3;
        }).caught(function(value) {
            assert.equal(value.message, "test");
        });
    });

    specify("passes through reason after returned promise is fulfilled", function() {
        var async = false;
        return rejection().tapError(function() {
            return new Promise(function(r) {
                setTimeout(function(){
                    async = true;
                    r(3);
                }, 1);
            });
        }).caught(function(value) {
            assert(async);
            assert.equal(value.message, "test");
        });
    });

    specify("is not called on fulfilled promise", function() {
        var called = false;
        return Promise.resolve("test").tapError(function() {
            called = true;
        }).then(function(value){
            assert(!called);
        }, assert.fail);
    });

    specify("passes immediate rejection", function() {
        var err = new Error();
        return rejection().tapError(function() {
            throw err;
        }).tap(assert.fail).then(assert.fail, function(e) {
            assert(err === e);
        });
    });

    specify("passes eventual rejection", function() {
        var err = new Error();
        return rejection().tapError(function() {
            return new Promise(function(_, rej) {
                setTimeout(function(){
                    rej(err);
                }, 1)
            });
        }).tap(assert.fail).then(assert.fail, function(e) {
            assert(err === e);
        });
    });

    specify("passes reason", function() {
        return rejection().tapError(function(a) {
            assert(a === rejection);
        }).then(assert.fail, function() {});
    });

    specify("Works with predicates", function() {
        var called = false;
        return Promise.reject(new TypeError).tapError(TypeError, function(a) {
            called = true;
        }).then(assert.fail, function(err) { 
            assert(called === true);
            assert(err instanceof TypeError);
        });
    });
    specify("Does not get called on predicates that don't match ", function() {
        var called = false;
        return Promise.reject(new TypeError).tapError(ReferneceError, function(a) {
            called = true;
        }).then(assert.fail, function(err) { 
            assert(called === false);
            assert(err instanceof ReferenceError);
        });
    });
});
