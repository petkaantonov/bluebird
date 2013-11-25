"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var getValues = function() {
    var d = Promise.defer();
    var f = Promise.resolve(3);
    var r = Promise.reject(3);

    setTimeout(function(){
        d.resolve(3);
    }, 40);

    return {
        value: 3,
        thenableFulfill: {then: function(fn){setTimeout(function(){fn(3)}, 40);}},
        thenableReject: {then: function(_, fn){setTimeout(function(){fn(3)}, 40);}},
        promiseFulfilled: f,
        promiseRejected: r,
        promiseEventual: d.promise
    };
};

function expect(count, done) {
    var total = 0;
    return function() {
        total++;
        if (total >= count) {
            done();
        }
    }
}

describe("Promise.resolve", function() {
    specify("follows thenables and promises", function(done) {
        done = expect(6, done);
        var values = getValues();
        var async = false;

        function onFulfilled(v) {
            assert(v === 3);
            assert(async);
            done();
        }

        Promise.resolve(values.value).then(onFulfilled);
        Promise.resolve(values.thenableFulfill).then(onFulfilled);
        Promise.resolve(values.thenableReject).then(assert.fail, onFulfilled);
        Promise.resolve(values.promiseFulfilled).then(onFulfilled);
        Promise.resolve(values.promiseRejected).then(assert.fail, onFulfilled);
        Promise.resolve(values.promiseEventual).then(onFulfilled);
        async = true;
    });
});

describe("PromiseResolver.resolve", function() {
    specify("follows thenables and promises", function(done) {
        done = expect(6, done);
        var values = getValues();
        var async = false;

        function onFulfilled(v) {
            assert(v === 3);
            assert(async);
            done();
        }

        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        var d4 = Promise.defer();
        var d5 = Promise.defer();
        var d6 = Promise.defer();

        d1.resolve(values.value);
        d1.promise.then(onFulfilled);
        d2.resolve(values.thenableFulfill);
        d2.promise.then(onFulfilled);
        d3.resolve(values.thenableReject);
        d3.promise.then(assert.fail, onFulfilled);
        d4.resolve(values.promiseFulfilled);
        d4.promise.then(onFulfilled);
        d5.resolve(values.promiseRejected);
        d5.promise.then(assert.fail, onFulfilled);
        d6.resolve(values.promiseEventual);
        d6.promise.then(onFulfilled);
        async = true;
    });
});

describe("Cast thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function(done) {
        var promise = Promise.cast(a);

        promise.then(assert.fail).caught(Promise.TypeError, function(){
            done();
        });
    });

    specify("rejects with itself", function(done) {
        var promise = Promise.cast(b);

        promise.caught(function(v){
           assert(v === b);
           done();
        });
    });
});

describe("Implicitly cast thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function(done) {
        Promise.fulfilled().then(function(){
            return a;
        }).caught(Promise.TypeError, function(){
            done();
        });
    });

    specify("rejects with itself", function(done) {
        Promise.fulfilled().then(function(){
            return b;
        }).caught(function(v){
            assert(v === b);
            done();
        });
    });
});
