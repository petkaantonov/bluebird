"use strict";

var assert = require("assert");
var Promise = adapter;

function makeFakePromise(val) {
    var p = {
        count: 0,
        then: function(f) {
            p.count += 1;
            return Promise.resolve(val).then(f);
        }
    };
    return p;
}

describe("github-1455 Promise.each thenable then-count", function() {
    specify("thenables in an array are only then'd once", function() {
        var arrayOfPromises = [0, 1, 2].map(makeFakePromise);
        return Promise.each(arrayOfPromises, function() {
        }).then(function(result) {
            assert.deepEqual(result, [0, 1, 2]);
            assert.strictEqual(arrayOfPromises[0].count, 1);
            assert.strictEqual(arrayOfPromises[1].count, 1);
            assert.strictEqual(arrayOfPromises[2].count, 1);
        });
    });

    specify("a thenable of an array of thenables is only then'd once",
    function() {
        var arrayOfPromises = [0, 1, 2].map(makeFakePromise);
        var promisedArray = makeFakePromise(arrayOfPromises);
        return Promise.each(promisedArray, function() {
        }).then(function(result) {
            assert.deepEqual(result, [0, 1, 2]);
            assert.strictEqual(promisedArray.count, 1);
            assert.strictEqual(arrayOfPromises[0].count, 1);
            assert.strictEqual(arrayOfPromises[1].count, 1);
            assert.strictEqual(arrayOfPromises[2].count, 1);
        });
    });

    specify("Promise.prototype.each only thens each thenable once", function() {
        var arrayOfPromises = [0, 1, 2].map(makeFakePromise);
        return Promise.resolve(arrayOfPromises).each(function() {
        }).then(function(result) {
            assert.deepEqual(result, [0, 1, 2]);
            assert.strictEqual(arrayOfPromises[0].count, 1);
            assert.strictEqual(arrayOfPromises[1].count, 1);
            assert.strictEqual(arrayOfPromises[2].count, 1);
        });
    });

    specify("iterator receives resolved values and result ignores mapper",
    function() {
        var seen = [];
        var arrayOfPromises = [10, 20, 30].map(makeFakePromise);
        return Promise.each(arrayOfPromises, function(value, index, length) {
            seen.push(value, index, length);
            return value * 2;
        }).then(function(result) {
            assert.deepEqual(seen, [10, 0, 3, 20, 1, 3, 30, 2, 3]);
            assert.deepEqual(result, [10, 20, 30]);
            assert.strictEqual(arrayOfPromises[0].count, 1);
            assert.strictEqual(arrayOfPromises[1].count, 1);
            assert.strictEqual(arrayOfPromises[2].count, 1);
        });
    });

    specify("a thenable of an empty array is only then'd once", function() {
        var promisedArray = makeFakePromise([]);
        return Promise.each(promisedArray, function() {
            throw new Error();
        }).then(function(result) {
            assert.deepEqual(result, []);
            assert.strictEqual(promisedArray.count, 1);
        });
    });

    specify("rejected thenable is only then'd once", function() {
        var err = new Error("boom");
        var p = {
            count: 0,
            then: function(f, r) {
                p.count += 1;
                r(err);
            }
        };
        return Promise.each([p], function() {
            throw new Error("should not iterate");
        }).then(assert.fail, function(reason) {
            assert.strictEqual(reason, err);
            assert.strictEqual(p.count, 1);
        });
    });
});
