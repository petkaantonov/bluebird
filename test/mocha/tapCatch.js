"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
function rejection() {
    var error = new Error("test");
    var rejection = Promise.reject(error);
    rejection.err = error;
    return rejection;
}

describe("tapCatch", function () {

    specify("passes through rejection reason", function() {
        return rejection().tapCatch(function() {
            return 3;
        }).caught(function(value) {
            assert.equal(value.message, "test");
        });
    });

    specify("passes through reason after returned promise is fulfilled", function() {
        var async = false;
        return rejection().tapCatch(function() {
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
        return Promise.resolve("test").tapCatch(function() {
            called = true;
        }).then(function(value){
            assert(!called);
        }, assert.fail);
    });

    specify("passes immediate rejection", function() {
        var err = new Error();
        return rejection().tapCatch(function() {
            throw err;
        }).tap(assert.fail).then(assert.fail, function(e) {
            assert(err === e);
        });
    });

    specify("passes eventual rejection", function() {
        var err = new Error();
        return rejection().tapCatch(function() {
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
        return rejection().tapCatch(function(a) {
            assert(a === rejection);
        }).then(assert.fail, function() {});
    });

    specify("Works with predicates", function() {
        var called = false;
        return Promise.reject(new TypeError).tapCatch(TypeError, function(a) {
            called = true;
            assert(err instanceof TypeError)
        }).then(assert.fail, function(err) {
            assert(called === true);
            assert(err instanceof TypeError);
        });
    });
    specify("Does not get called on predicates that don't match", function() {
        var called = false;
        return Promise.reject(new TypeError).tapCatch(ReferenceError, function(a) {
            called = true;
        }).then(assert.fail, function(err) {
            assert(called === false);
            assert(err instanceof TypeError);
        });
    });

    specify("Supports multiple predicates", function() {
        var calledA = false;
        var calledB = false;
        var calledC = false;

        var promiseA = Promise.reject(new ReferenceError).tapCatch(
            ReferenceError,
            TypeError,
            function (e) {
                assert(e instanceof ReferenceError);
                calledA = true;
            }
        ).catch(function () {});

        var promiseB = Promise.reject(new TypeError).tapCatch(
            ReferenceError,
            TypeError,
            function (e) {
                assert(e instanceof TypeError);
                calledB = true;
            }
        ).catch(function () {});

        var promiseC = Promise.reject(new SyntaxError).tapCatch(
            ReferenceError,
            TypeError,
            function (e) {
                calledC = true;
            }
        ).catch(function () {});

        return Promise.join(promiseA, promiseB, promiseC, function () {
            assert(calledA === true);
            assert(calledB === true);
            assert(calledC === false);
        });
    })
});
