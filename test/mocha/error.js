"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.prototype.error", function(){
    describe("catches stuff originating from explicit rejections", function() {
        specify("using constructor", function(done) {
            var e = new Error("sup");
            new Promise(function(resolve, reject) {
                reject(e);
            }).error(function(err){
                assert(err === e);
                done();
            });
        });
        specify("using Promise.reject", function(done) {
            var e = new Error("sup");
            Promise.reject(e).error(function(err) {
                assert(err === e);
                done();
            });
        });
        specify("using deferred", function(done) {
            var e = new Error("sup");
            var d = Promise.defer();
            d.promise.error(function(err) {
                assert(err === e);
                done();
            });
            d.reject(e);
        });

        specify("using callback", function(done) {
            var e = new Promise.TypeError("sup");
            function callsback(a, b, c, fn) {
                fn(e);
            }
            callsback = Promise.promisify(callsback);

            callsback(1, 2, 3).error(function(err) {
                assert(err === e);
                done();
            });
        });
    });

    describe("does not catch stuff originating from thrown errors", function() {
        specify("using constructor", function(done) {
            var e = new Error("sup");
            new Promise(function(resolve, reject) {
                throw e;
            }).error(function(err) {
                assert.fail();
            }).caught(function(err){
                assert(err === e);
                done();
            });
        });
        specify("using thenable", function(done) {
            var e = new Error("sup");
            var thenable = {
                then: function(resolve, reject){
                    reject(e);
                }
            };
            Promise.cast(thenable).error(function(err) {
                console.error(err);
                assert.fail();
            }).caught(function(err) {
                assert(err === e);
                done();
            });
        });
        specify("using callback", function(done) {
            var e = new Error("sup");
            function callsback(a, b, c, fn) {
                throw e;
            }
            callsback = Promise.promisify(callsback);

            callsback(1, 2, 3).error(function(err) {
                assert.fail();
            }).caught(function(err){
                assert(err === e);
                done();
            });
        });
    });

    specify("gh-54-1", function(done) {
        function doThing(arg) {
          return new Promise(function (resolve, rej) {
            if (typeof arg !== "string") return rej(new Error("invalid thing"));
          });
        }

        doThing().error(function(){
            done();
        }).caught(function(){
            assert.fail();
        });

    });

    specify("gh-54-2", function(done) {
        function doBuggyThing(arg) {
          return new Promise(function (resolve, rej) {
            // arg2 & reject dont exist. this is buggy.
            if (arg2 && typeof arg2 !== "string") return Promise.reject(new Error("invalid thing"));
          });
        }
        var called = false;
        doBuggyThing().error(function(){
            called = true;
        }).caught(function() {

        });

        setTimeout(function(){
            assert(!called);
            done();
        }, 13);

    });
})

describe("Error constructors", function() {
    describe("OperationalError", function() {
        it("should work without new", function() {
            var a = Promise.OperationalError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.OperationalError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });
    });

    describe("CancellationError", function() {
        it("should work without new", function() {
            var a = Promise.CancellationError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.CancellationError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });
    });

    describe("TimeoutError", function() {
        it("should work without new", function() {
            var a = Promise.TimeoutError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.TimeoutError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });
    });

    describe("AggregateError", function() {
        it("should work without new", function() {
            var a = Promise.AggregateError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.AggregateError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should stringify without circular errors", function() {
            var a = Promise.AggregateError();
            a.push(new Error("1"));
            a.push(new Error("2"));
            a.push(new Error("3"));
            a = a.toString();
            assert(a.indexOf("Error: 1") >= 0);
            assert(a.indexOf("Error: 2") >= 0);
            assert(a.indexOf("Error: 3") >= 0);
        });

        it("should stringify with circular errors", function() {
            var a = Promise.AggregateError();
            a.push(new Error("1"));
            a.push(a);
            a.push(new Error("3"));
            a = a.toString();
            assert(a.indexOf("Error: 1") >= 0);
            assert(a.indexOf("[Circular AggregateError]") >= 0);
            assert(a.indexOf("Error: 3") >= 0);
        });
    });


});
