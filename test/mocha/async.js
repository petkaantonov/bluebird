"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

describe("Async requirement", function() {

    var arr = [];

    function a() {
        arr.push(1);
    }

    function b() {
        arr.push(2);
    }

    function c() {
        arr.push(3);
    }


    function assertArr() {
        assert.deepEqual(arr, [1,2,3]);
        arr.length = 0;
    }


    specify("Basic", function(done) {
        var p = new Promise(function(resolve) {
            resolve();
        });
        a();
        p.then(c);
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Resolve-Before-Then", function(done) {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        resolveP();
        p.then(c);
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Resolve-After-Then", function(done) {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        p.then(c);
        resolveP();
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Then-Inside-Then", function(done) {
        var fulfilledP = Promise.fulfilled();
        fulfilledP.then(function() {
            a();
            fulfilledP.then(c).then(assertArr).then(function(){
                done();
            }).done();
            b();
        });
    });

    if( typeof Error.captureStackTrace === "function" ) {
        describe("Should not grow the stack and cause eventually stack overflow.", function(){
            Error.stackTraceLimit = 10000;

            function assertStackIsNotGrowing(stack) {
                assert(stack.split("\n").length > 5);
                assert(stack.split("\n").length < 15);
            }

            specify("Already fulfilled.", function(done) {
                function test(i){
                    if (i <= 0){
                       return Promise.fulfilled(new Error().stack);
                   } else {
                       return Promise.fulfilled(i-1).then(test)
                   }
                }
                test(100).then(function(stack) {
                    assertStackIsNotGrowing(stack);
                    done();
                });
            });

            specify("Already rejected", function(done) {
                function test(i){
                    if (i <= 0){
                       return Promise.rejected(new Error().stack);
                   } else {
                       return Promise.rejected(i-1).then(assert.fail, test)
                   }
                }
                test(100).then(assert.fail, function(stack) {
                    assertStackIsNotGrowing(stack);
                    done();
                });
            });

            specify("Immediately fulfilled", function(done) {
                function test(i){
                    var deferred = Promise.pending();
                    if (i <= 0){
                       deferred.fulfill(new Error().stack);
                       return deferred.promise;
                   } else {
                       deferred.fulfill(i-1);
                       return deferred.promise.then(test)
                   }
                }
                test(100).then(function(stack) {
                    assertStackIsNotGrowing(stack);
                    done();
                });
            });

            specify("Immediately rejected", function(done) {
                function test(i){
                    var deferred = Promise.pending();
                    if (i <= 0){
                       deferred.reject(new Error().stack);
                       return deferred.promise;
                   } else {
                       deferred.reject(i-1);
                       return deferred.promise.then(assert.fail, test)
                   }
                }
                test(100).then(assert.fail, function(stack) {
                    assertStackIsNotGrowing(stack);
                    done();
                });
            });
        });
    }
});