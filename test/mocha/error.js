"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

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
          return new Promise(function (resolve, reject) {
            if (typeof arg !== "string") return reject(new Error("invalid thing"));
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
            if (arg2 && typeof arg2 !== "string") return reject(new Error("invalid thing"));
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
