"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
describe("Promise.props", function () {

    specify("should reject undefined", function() {
        return Promise.props().caught(TypeError, function(){
        })
    });

    specify("should reject primitive", function() {
        return Promise.props("str").caught(TypeError, function(){
        })
    });

    specify("should resolve to new object", function() {
        var o = {};
        return Promise.props(o).then(function(v){
            assert(v !== o);
            assert.deepEqual(o, v);
        });
    });

    specify("should resolve value properties", function() {
        var o = {
            one: 1,
            two: 2,
            three: 3
        };
        return Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });
    });

    specify("should resolve immediate properties", function() {
        var o = {
            one: Promise.resolve(1),
            two: Promise.resolve(2),
            three: Promise.resolve(3)
        };
        return Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });
    });

    specify("should resolve eventual properties", function() {
        var d1 = Promise.defer(),
            d2 = Promise.defer(),
            d3 = Promise.defer();
        var o = {
            one: d1.promise,
            two: d2.promise,
            three: d3.promise
        };

        setTimeout(function(){
            d1.fulfill(1);
            d2.fulfill(2);
            d3.fulfill(3);
        }, 1);

        return Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });


    });

    specify("should reject if any input promise rejects", function() {
        var o = {
            one: Promise.resolve(1),
            two: Promise.reject(2),
            three: Promise.resolve(3)
        };
        return Promise.props(o).then(assert.fail, function(v){
            assert(v === 2);
        });
    });

    specify("should accept a promise for an object", function() {
         var o = {
            one: Promise.resolve(1),
            two: Promise.resolve(2),
            three: Promise.resolve(3)
        };
        var d1 = Promise.defer();
        setTimeout(function(){
            d1.fulfill(o);
        }, 1);
        return Promise.props(d1.promise).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });

    });

    specify("should reject a promise for a primitive", function() {
        var d1 = Promise.defer();
        setTimeout(function(){
            d1.fulfill("text");
        }, 1);
        return Promise.props(d1.promise).caught(TypeError, function(){
        });

    });

    specify("should accept thenables in properties", function() {
        var t1 = {then: function(cb){cb(1);}};
        var t2 = {then: function(cb){cb(2);}};
        var t3 = {then: function(cb){cb(3);}};
        var o = {
            one: t1,
            two: t2,
            three: t3
        };
        return Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });
    });

    specify("should accept a thenable for thenables in properties", function() {
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
        return Promise.props(o).then(function(v){
            assert.deepEqual({
                one: 1,
                two: 2,
                three: 3
            }, v);
        });
    });

    specify("treats arrays for their properties", function() {
        var o = [1,2,3];

        return Promise.props(o).then(function(v){
            assert.deepEqual({
                0: 1,
                1: 2,
                2: 3
            }, v);
        });
    });


    if (typeof Map !== "undefined") {
        specify("works with es6 maps", function() {
            return Promise.props(new Map([
                ["a", Promise.resolve(1)],
                ["b", Promise.resolve(2)],
                ["c", Promise.resolve(3)]
            ])).then(function(result) {
                assert.strictEqual(result.get("a"), 1);
                assert.strictEqual(result.get("b"), 2);
                assert.strictEqual(result.get("c"), 3);
            });
        });

        specify("doesn't await promise keys in es6 maps", function() {
            var a = new Promise(function() {});
            var b = new Promise(function() {});
            var c = new Promise(function() {});

            return Promise.props(new Map([
                [a, Promise.resolve(1)],
                [b, Promise.resolve(2)],
                [c, Promise.resolve(3)]
            ])).then(function(result) {
                assert.strictEqual(result.get(a), 1);
                assert.strictEqual(result.get(b), 2);
                assert.strictEqual(result.get(c), 3);
            });
        });

        specify("empty map should resolve to empty map", function() {
            return Promise.props(new Map()).then(function(result) {
                assert(result instanceof Map);
            });
        });
    }

});
