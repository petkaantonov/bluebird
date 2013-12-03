"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

function fulfills(value, test) {
    specify("immediately-fulfilled", function (done) {
        test(new Promise(function(resolve){
            resolve(value);
        }), done);
    });

    specify("eventually-fulfilled", function (done) {
        test(new Promise(function(resolve){
            setTimeout(function(){
                resolve(value);
            }, 13);
        }), done);
    });
};

function rejects(reason, test) {
    specify("immediately-rejected", function (done) {
        test(new Promise(function(resolve, reject){
            reject(reason);
        }), done);
    });

    specify("eventually-rejected", function (done) {
        test(new Promise(function(resolve, reject){
            setTimeout(function(){
                reject(reason);
            }, 13);
        }), done);
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
        }, 13)

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
                }, 13);
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
    it("should throw type error when called as function", function(done) {
        try {
            Promise(function(){});
        }
        catch (e) {
            done();
        }
    });

    it("should throw type error when passed non-function", function(done) {
        try {
            new Promise({});
        }
        catch (e) {
            done();
        }
    });


    var defaultThis = (function(){
        return this;
    })();

    it("calls the resolver as a function", function(done){
        new Promise(function() {
            assert(this === defaultThis);
            done();
        });
    });

    it("passes arguments even if parameters are not defined", function(done){
        new Promise(function() {
            assert(arguments.length === 2);
            done();
        });
    });


    it("should reject with any thrown error", function(done) {
        var e = new Error();
        new Promise(function(){
            throw e;
        }).then(assert.fail, function(err) {
            assert(err === e)
            done();
        });
    });

    it("should call the resolver function synchronously", function(done) {
        var e = new Error();
        var a = 0;
        new Promise(function(){
            a = 1;
        });
        assert(a === 1);
        done();
    });


    describe("resolves the promise with the given object value", function() {
        var value = {};
        testFulfilled(value, function(promise, done) {
            promise.then(function(v){
                assert(v === value);
                done();
            });
        });
    });

    describe("resolves the promise with the given primitive value", function() {
        var value = 3;
        testFulfilled(value, function(promise, done) {
            promise.then(function(v){
                assert(v === value);
                done();
            });
        });
    });

    describe("resolves the promise with the given undefined value", function() {
        var value = void 0;
        testFulfilled(value, function(promise, done) {
            promise.then(function(v){
                assert(v === value);
                done();
            });
        });
    });

    describe("rejects the promise with the given object reason", function() {
        var reason = {};
        testRejected(reason, function(promise, done) {
            promise.then(assert.fail, function(v){
                assert(v === reason);
                done();
            });
        });
    });

    describe("rejects the promise with the given primitive reason", function() {
        var reason = 3;
        testRejected(reason, function(promise, done) {
            promise.then(assert.fail, function(v){
                assert(v === reason);
                done();
            });
        });
    });

    describe("rejects the promise with the given undefined reason", function() {
        var reason = void 0;
        testRejected(reason, function(promise, done) {
            promise.then(assert.fail, function(v){
                assert(v === reason);
                done();
            });
        });
    });

});
