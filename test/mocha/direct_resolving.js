"use strict";

"use strict";

var assert = require("assert");

var helpers = require("./helpers/testThreeCases.js");
var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
var TypeError = Promise.TypeError;

function passthru(fn) {
    return function() {
        fn();
    };
}

function wrap(fn, val) {
    var args = [].slice.call(arguments, 1);
    return function() {
        return fn.apply(this, args);
    }
}

function returnValue(value) {
    helpers.testFulfilled(void 0, function(promise, done) {
        promise.thenReturn(value).then(function(v){
            assert(v === value);
            done();
        });
    });
}

function throwValue(value) {
    helpers.testFulfilled(void 0, function(promise, done) {
        promise.thenThrow(value).then(assert.fail, function(v) {
            assert(v === value);
            done();
        });
    });
}

function returnThenable(thenable, expected) {
    helpers.testFulfilled(void 0, function(promise, done) {
        promise.thenReturn(thenable).then(function(v){
            assert(v === expected);
            done();
        });
    });
}

function returnThenableReject(thenable, expected) {
    helpers.testFulfilled(void 0, function(promise, done) {
        promise.thenReturn(thenable).then(assert.fail, function(v){
            assert(v === expected);
            done();
        });
    });
}

describe("thenReturn", function () {

    describe("primitives", function() {
        describe("null", wrap(returnValue, null));
        describe("undefined", wrap(returnValue, void 0));
        describe("string", wrap(returnValue, "asd"));
        describe("number", wrap(returnValue, 3));
        describe("boolean", wrap(returnValue, true));
    });

    describe("objects", function() {
        describe("plain", wrap(returnValue, {}));
        describe("function", wrap(returnValue, function(){}));
        describe("built-in function", wrap(returnValue, Array));
        describe("built-in object", wrap(returnValue, Math));
    });

    describe("thenables", function() {
        describe("which fulfill", function() {
            describe("immediately", wrap(returnThenable, {
                then: function(f) {
                    f(10);
                }
            }, 10));
            describe("eventually", wrap(returnThenable, {
                then: function(f) {
                    setTimeout(function() {
                        f(10);
                    }, 13);
                }
            }, 10));
        });
        describe("which reject", function(){
            describe("immediately", wrap(returnThenableReject, {
                then: function(f, r) {
                    r(10);
                }
            }, 10));
            describe("eventually", wrap(returnThenableReject, {
                then: function(f, r) {
                    setTimeout(function() {
                        r(10);
                    }, 13);
                }
            }, 10));
        });
    });

    describe("promises", function() {
        describe("which fulfill", function() {
            var d1 = Promise.pending();
            var d2 = Promise.pending();
            describe("already", wrap(returnThenable, fulfilled(10), 10));
            describe("immediately", wrap(returnThenable, d1.promise, 10));
            describe("eventually", wrap(returnThenable, d2.promise, 10));
            d1.fulfill(10);
            setTimeout(function(){
                d2.fulfill(10);
            }, 13);
        });
        describe("which reject", function() {
            var d1 = Promise.pending();
            var d2 = Promise.pending();
            var alreadyRejected = rejected(10);
            alreadyRejected.caught(function(){});
            describe("already", wrap(returnThenableReject, alreadyRejected, 10));
            describe("immediately", wrap(returnThenableReject, d1.promise, 10));
            describe("eventually", wrap(returnThenableReject, d2.promise, 10));
            d1.reject(10);
            setTimeout(function(){
                d2.reject(10);
            }, 13);

            d1.promise.caught(function(){});
            d2.promise.caught(function(){});
        });

    });

    describe("doesn't swallow errors", function() {
        var e = {};
        helpers.testRejected(e, function(promise, done){
            promise.thenReturn(3).then(assert.fail, function(err) {
                assert(err = e);
                done();
            });
        });
    });
});

describe("thenThrow", function () {

    describe("primitives", function() {
        describe("null", wrap(throwValue, null));
        describe("undefined", wrap(throwValue, void 0));
        describe("string", wrap(throwValue, "asd"));
        describe("number", wrap(throwValue, 3));
        describe("boolean", wrap(throwValue, true));
    });

    describe("objects", function() {
        describe("plain", wrap(throwValue, {}));
        describe("function", wrap(throwValue, function(){}));
        describe("built-in function", wrap(throwValue, Array));
        describe("built-in object", wrap(throwValue, Math));
    });

    describe("doesn't swallow errors", function() {
        var e = {};
        helpers.testRejected(e, function(promise, done){
            promise.thenThrow(3).then(assert.fail, function(err) {
                assert(err = e);
                done();
            });
        });
    });
});
