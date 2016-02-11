"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


function fulfills(value, test) {
    specify("immediately-fulfilled", function() {
        return test(new Promise(function(resolve){
            resolve(value);
        }));
    });

    specify("eventually-fulfilled", function() {
        return test(new Promise(function(resolve){
            setTimeout(function(){
                resolve(value);
            }, 1);
        }));
    });
};

function rejects(reason, test) {
    specify("immediately-rejected", function() {
        return test(new Promise(function(resolve, reject){
            reject(reason);
        }));
    });

    specify("eventually-rejected", function() {
        return test(new Promise(function(resolve, reject){
            setTimeout(function(){
                reject(reason);
            }, 1);
        }));
    });
};

function testFulfilled(value, test) {
    describe("immediate value", function(){
        fulfills(value, test);
    });

    describe("already fulfilled promise for value", function(){
        fulfills(Promise.resolve(value), test);
    });

    describe("immediately fulfilled promise for value", function(){
        var a = Promise.defer();
        fulfills(a.promise, test);
        a.resolve(value);
    });

    describe("eventually fulfilled promise for value", function(){
        var a = Promise.defer();
        fulfills(a.promise, test);
        setTimeout(function(){
            a.resolve(value);
        }, 1)

    });

    describe("synchronous thenable for value", function () {
        fulfills({
            then: function (f) {
                f(value);
            }
        }, test);
    });

    describe("asynchronous thenable for value", function () {
        fulfills({
            then: function (f) {
                setTimeout(function () {
                    f(value);
                }, 1);
            }
        }, test);
    });
}

function testRejected(reason, test) {
    describe("immediate reason", function(){
        rejects(reason, test);
    });
}


describe("Promise constructor", function() {
    it("should throw type error when called as function", function() {
        try {
            Promise(function(){});
        }
        catch (e) {
            return;
        }
        assert.fail();
    });

    it("should throw type error when passed non-function", function() {
        try {
            new Promise({});
        }
        catch (e) {
            return;
        }
        assert.fail();
    });


    var defaultThis = (function(){
        return this;
    })();

    it("calls the resolver as a function", function(){
        new Promise(function() {
            assert(this === defaultThis);
        });
    });

    it("passes arguments even if parameters are not defined", function(){
        new Promise(function() {
            assert(arguments.length === 2 || arguments.length === 3);
        });
    });


    it("should reject with any thrown error", function() {
        var e = new Error();
        return new Promise(function(){
            throw e;
        }).then(assert.fail, function(err) {
            assert(err === e)
        });
    });

    it("should call the resolver function synchronously", function() {
        var e = new Error();
        var a = 0;
        new Promise(function(){
            a = 1;
        });
        assert(a === 1);
    });


    describe("resolves the promise with the given object value", function() {
        var value = {};
        testFulfilled(value, function(promise) {
            return promise.then(function(v){
                assert(v === value);
            });
        });
    });

    describe("resolves the promise with the given primitive value", function() {
        var value = 3;
        testFulfilled(value, function(promise) {
            return promise.then(function(v){
                assert(v === value);
            });
        });
    });

    describe("resolves the promise with the given undefined value", function() {
        var value = void 0;
        testFulfilled(value, function(promise) {
            return promise.then(function(v){
                assert(v === value);
            });
        });
    });

    describe("rejects the promise with the given object reason", function() {
        var reason = {};
        testRejected(reason, function(promise) {
            return promise.then(assert.fail, function(v){
                assert(v === reason);
            });
        });
    });

    describe("rejects the promise with the given primitive reason", function() {
        var reason = 3;
        testRejected(reason, function(promise) {
            return promise.then(assert.fail, function(v){
                assert(v === reason);
            });
        });
    });

    describe("rejects the promise with the given undefined reason", function() {
        var reason = void 0;
        testRejected(reason, function(promise) {
            return promise.then(assert.fail, function(v){
                assert(v === reason);
            });
        });
    });

});
