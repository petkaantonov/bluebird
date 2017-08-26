"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");


describe("taps", function () {
    it("spreads values across arguments", function () {
        return Promise.resolve([1, 2, 3]).taps(function (a, b) {
            assert.equal(b,2);
        });
    });

    it("spreads arrays of promises across arguments", function () {
        var deferredA = Promise.defer();
        var deferredB = Promise.defer();

        var promise = Promise.resolve([deferredA.promise, deferredB.promise]).all().taps(
                               function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });

        Promise.delay(1).then(function () {
            deferredA.resolve(10);
        });
        Promise.delay(1).then(function () {
            deferredB.resolve(20);
        });

        return promise;
    });

    it("spreads arrays of thenables across arguments", function () {
        var p1 = {
            then: function(v) {
                v(10);
            }
        };
        var p2 = {
            then: function(v) {
                v(20);
            }
        };

        var promise = Promise.resolve([p1, p2]).all().taps(function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });
        return promise;
    });

    it("should wait for promises in the returned array even when not calling .all", function() {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        setTimeout(function(){
            d1.resolve(1);
            d2.resolve(2);
            d3.resolve(3);
        }, 1);
        return Promise.resolve().then(function(){
            return [d1.promise, d2.promise, d3.promise];
        }).all().taps(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for thenables in the returned array even when not calling .all", function() {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 1);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 1);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 1);
            }
        };
        return Promise.resolve().then(function(){
            return [t1, t2, t3];
        }).all().taps(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for promises in an array that a returned promise resolves to even when not calling .all", function() {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        var defer = Promise.defer();

        setTimeout(function(){
            defer.resolve([d1.promise, d2.promise, d3.promise]);
            setTimeout(function(){
                d1.resolve(1);
                d2.resolve(2);
                d3.resolve(3);
            }, 1);
        }, 1);

        return Promise.resolve().then(function(){
            return defer.promise;
        }).all().taps(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for thenables in an array that a returned thenable resolves to even when not calling .all", function() {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 1);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 1);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 1);
            }
        };

        var thenable = {
            then: function(fn) {
                setTimeout(function(){
                    fn([t1, t2, t3])
                }, 1);
            }
        };

        return Promise.resolve().then(function(){
            return thenable;
        }).all().taps(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should reject with error when non array is the ultimate value to be spread", function(){
        return Promise.resolve().then(function(){
            return 3
        }).taps(function(a, b, c){
            assert.fail();
        }).then(assert.fail, function(e){
        })
    });

    specify("error when passed non-function", function() {
        return Promise.resolve(3)
                .taps()
                .then(assert.fail)
                .caught(Promise.TypeError, function() {});
    });

    specify("error when resolution is non-spredable", function() {
        return Promise.resolve(3)
                .taps(function(){})
                .then(assert.fail)
                .caught(Promise.TypeError, function() {});
    });

    it("passes through values", function() {
        return Promise.resolve([1, 2]).taps(function() {
            return 3;
        }).then(function(value){
            assert.deepEqual(value, [1, 2]);
        });
    });

    it("passes through value after returned promise is fulfilled", function() {
        var async = false;
        return Promise.resolve(["a", "b"]).taps(function() {
            return new Promise(function(r) {
                setTimeout(function(){
                    async = true;
                    r(3);
                }, 1);
            });
        }).then(function(value){
            assert(async);
            assert.deepEqual(value, ["a", "b"]);
        });
    });

    specify("is not called on rejected promise", function() {
        var called = false;
        return Promise.reject(["test"]).taps(function() {
            called = true;
        }).then(assert.fail, function(value){
            assert(!called);
        });
    });

    specify("passes immediate rejection", function() {
        var err = new Error();
        return Promise.resolve(["test"]).taps(function() {
            throw err;
        }).tap(assert.fail).then(assert.fail, function(e){
            assert(err === e);
        });
    });

    specify("passes eventual rejection", function() {
        var err = new Error();
        return Promise.resolve(["test"]).taps(function() {
            return new Promise(function(_, rej) {
                setTimeout(function(){
                    rej(err);
                }, 1)
            });
        }).tap(assert.fail).then(assert.fail, function(e) {
            assert(err === e);
        });
    });
});
