"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
describe("Promise.props", function () {

    specify("should reject undefined", function(done) {
        Promise.props().caught(TypeError, function(){
            done();
        })
    });

    specify("should reject primitive", function(done) {
        Promise.props("str").caught(TypeError, function(){
            done();
        })
    });

    specify("should resolve to new object", function(done) {
        var o = {};
        Promise.props(o).then(function(v){
            assert(v !== o);
            assert.deepEqual(o, v);
            done();
        });
    });

    specify("should resolve value properties", function(done) {
        var o = {
            one: 1,
            two: 2,
            three: 3
        };
        Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });
    });

    specify("should resolve immediate properties", function(done) {
        var o = {
            one: Promise.resolve(1),
            two: Promise.resolve(2),
            three: Promise.resolve(3)
        };
        Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });
    });

    specify("should resolve eventual properties", function(done) {
        var d1 = Promise.defer(),
            d2 = Promise.defer(),
            d3 = Promise.defer();
        var o = {
            one: d1.promise,
            two: d2.promise,
            three: d3.promise
        };
        Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });

        setTimeout(function(){
            d1.fulfill(1);
            d2.fulfill(2);
            d3.fulfill(3);
        }, 13);
    });

    specify("should reject if any input promise rejects", function(done) {
        var o = {
            one: Promise.resolve(1),
            two: Promise.reject(2),
            three: Promise.resolve(3)
        };
        Promise.props(o).then(assert.fail, function(v){
            assert(v === 2);
            done();
        });
    });

    specify("should accept a promise for an object", function(done) {
         var o = {
            one: Promise.resolve(1),
            two: Promise.resolve(2),
            three: Promise.resolve(3)
        };
        var d1 = Promise.defer();
        Promise.props(d1.promise).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });
        setTimeout(function(){
            d1.fulfill(o);
        }, 13);
    });

    specify("should reject a promise for a primitive", function(done) {
        var d1 = Promise.defer();
        Promise.props(d1.promise).caught(TypeError, function(){
            done();
        });
        setTimeout(function(){
            d1.fulfill("text");
        }, 13);
    });

    specify("should accept thenables in properties", function(done) {
        var t1 = {then: function(cb){cb(1);}};
        var t2 = {then: function(cb){cb(2);}};
        var t3 = {then: function(cb){cb(3);}};
        var o = {
            one: t1,
            two: t2,
            three: t3
        };
        Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });
    });

    specify("should accept a thenable for thenables in properties", function(done) {
        var o = {
          then: function (f) {
            f({
              one: {
                then: function (cb) {
                  cb(1);
                }
              },
              two: {
                then: function (cb) {
                  cb(2);
                }
              },
              three: {
                then: function (cb) {
                  cb(3);
                }
              }
            });
          }
        };
        Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
            done();
        });
    });

    specify("sends { key, value } progress updates", function(done) {
        var deferred1 = Promise.defer();
        var deferred2 = Promise.defer();

        var progressValues = [];

        Promise.delay(50).then(function () {
            deferred1.progress("a");
        });
        Promise.delay(100).then(function () {
            deferred2.progress("b");
            deferred2.resolve();
        });
        Promise.delay(150).then(function () {
            deferred1.progress("c");
            deferred1.resolve();
        });

        Promise.props({
            one: deferred1.promise,
            two: deferred2.promise
        }).then(function () {
            assert.deepEqual(progressValues, [
                { key: "one", value: "a" },
                { key: "two", value: "b" },
                { key: "one", value: "c" }
            ]);
            done();
        },
        undefined,
        function (progressValue) {
            progressValues.push(progressValue);
        });
    });

    specify("treats arrays for their properties", function(done) {
        var o = [1,2,3];

        Promise.props(o).then(function(v){
            assert.deepEqual({
                0: 1,
                1: 2,
                2: 3
            }, v);
            done();
        });
    });

});
