"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


var c = {
    val: 3,
    method: function() {
        return [].slice.call(arguments).concat(this.val);
    }
};

describe("call", function() {
    specify("0 args", function() {
        return Promise.resolve(c).call("method").then(function(res) {
            assert.deepEqual([3], res);
        });
    });
    specify("1 args", function() {
        return Promise.resolve(c).call("method", 1).then(function(res) {
            assert.deepEqual([1, 3], res);
        });
    });
    specify("2 args", function() {
        return Promise.resolve(c).call("method", 1, 2).then(function(res) {
            assert.deepEqual([1, 2, 3], res);
        });
    });
    specify("3 args", function() {
        return Promise.resolve(c).call("method", 1, 2, 3).then(function(res) {
            assert.deepEqual([1, 2, 3, 3], res);
        });
    });
    specify("10 args", function() {
        return Promise.resolve(c).call("method", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10).then(function(res) {
            assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 3], res);
        });
    });
    specify("method not found", function() {
        var promises = [
          Promise.resolve([]).call("abc").then(assert.fail, testUtils.noop),
          Promise.resolve([]).call("abc", 1, 2, 3, 4, 5, 6, 7).then(assert.fail, testUtils.noop),
          Promise.resolve([]).call("abc ").then(assert.fail, testUtils.noop),
          Promise.resolve(null).call("abc", 1, 2, 3, 4, 5, 6, 7).then(assert.fail, testUtils.noop),
          Promise.resolve(null).call("abc").then(assert.fail, testUtils.noop),
          Promise.resolve(null).call("abc ").then(assert.fail, testUtils.noop)
        ];

        return Promise.all(promises).then(function(errors) {
            for (var i = 0; i < errors.length; ++i) {
                var message = errors[i].message || errors[i].toString();
                assert(message.indexOf("has no method") >= 0);
            }
        });
    });
});
