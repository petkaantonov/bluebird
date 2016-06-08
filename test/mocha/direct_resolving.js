"use strict";

"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

var helpers = require("./helpers/testThreeCases.js");
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
    helpers.testFulfilled(void 0, function(promise) {
        return promise.thenReturn(value).then(function(v){
            assert(v === value);
        });
    });
}

function throwValue(value) {
    helpers.testFulfilled(void 0, function(promise) {
        return promise.thenThrow(value).then(assert.fail, function(v) {
            assert(v === value);
        });
    });
}

function returnThenable(thenable, expected) {
    helpers.testFulfilled(void 0, function(promise) {
        return promise.thenReturn(thenable).then(function(v){
            assert(v === expected);
        });
    });
}

function returnThenableReject(thenable, expected) {
    helpers.testFulfilled(void 0, function(promise) {
        return promise.thenReturn(thenable).then(assert.fail, function(v){
            assert(v === expected);
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
                    }, 1);
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
                    }, 1);
                }
            }, 10));
        });
    });

    describe("promises", function() {
        describe("which fulfill", function() {
            var d1 = Promise.defer();
            var d2 = Promise.defer();
            describe("already", wrap(returnThenable, Promise.resolve(10), 10));
            describe("immediately", wrap(returnThenable, d1.promise, 10));
            describe("eventually", wrap(returnThenable, d2.promise, 10));
            d1.fulfill(10);
            setTimeout(function(){
                d2.fulfill(10);
            }, 1);
        });
        describe("which reject", function() {
            var d1 = Promise.defer();
            var d2 = Promise.defer();
            var alreadyRejected = Promise.reject(10);
            alreadyRejected.then(assert.fail, function(){});
            describe("already", wrap(returnThenableReject, alreadyRejected, 10));
            describe("immediately", wrap(returnThenableReject, d1.promise, 10));
            describe("eventually", wrap(returnThenableReject, d2.promise, 10));
            d1.reject(10);
            setTimeout(function(){
                d2.reject(10);
            }, 1);

            d1.promise.caught(function(){});
            d2.promise.caught(function(){});
        });

    });

    describe("doesn't swallow errors", function() {
        var e = {};
        helpers.testRejected(e, function(promise){
            return promise.thenReturn(3).then(assert.fail, function(err) {
                assert(err = e);
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
        helpers.testRejected(e, function(promise){
            return promise.thenThrow(3).then(assert.fail, function(err) {
                assert(err = e);
            });
        });
    });
});

describe("catchReturn", function () {

    specify("catches and returns", function() {
        return Promise.reject(3).catchReturn(1).then(function(val) {
            assert.strictEqual(1, val);
        });
    });

    specify("doesn't catch succesful promise", function() {
        return Promise.resolve(3).catchReturn(1).then(function(val) {
            assert.strictEqual(3, val);
        });
    });

    specify("supports 1 error type", function() {
        var e = new Error();
        e.prop = 3;
        var predicate = function(e) {return e.prop === 3};
        return Promise.reject(e)
                .catchReturn(TypeError, 1)
                .catchReturn(predicate, 2)
                .then(function(val) {
            assert.strictEqual(2, val);
        });
    });
});

describe("catchThrow", function () {

    specify("catches and throws", function() {
        return Promise.reject(3).catchThrow(1).then(assert.fail, function(val) {
            assert.strictEqual(1, val);
        });
    });

    specify("doesn't catch succesful promise", function() {
        return Promise.resolve(3).catchThrow(1).then(function(val) {
            assert.strictEqual(3, val);
        });
    });

    specify("supports 1 error type", function() {
        var e = new Error();
        e.prop = 3;
        var predicate = function(e) {return e.prop === 3};
        return Promise.reject(e)
                .catchThrow(TypeError, 1)
                .catchThrow(predicate, 2)
                .then(assert.fail, function(val) {
            assert.strictEqual(2, val);
        });
    });
});


describe("gh-627", function() {
    it("can return undefined", function() {
        return Promise.bind(42)
            .thenReturn(undefined)
            .then(function (value) {
              assert.strictEqual(value, undefined);
            });
    });
    it("can throw undefined", function() {
        return Promise.bind(42)
            .thenThrow(undefined)
            .then(assert.fail, function (reason) {
              assert.strictEqual(reason, undefined);
            });
    });

    it("can catch return undefined", function() {
        return Promise.bind(42).thenThrow(new Error())
            .catchReturn()
            .then(function (value) {
              assert.strictEqual(value, undefined);
            });
    });
    it("can catch throw undefined", function() {
        return Promise.bind(42).thenThrow(new Error())
            .catchThrow()
            .then(assert.fail, function (reason) {
              assert.strictEqual(reason, undefined);
            });
    });
});
