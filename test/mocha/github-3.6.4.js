"use strict";

var assert = require("assert");
var Promise = adapter;

function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}


describe("github-364", function() {
    specify("resolve between thens", function(done) {
        var calls = 0;
        var def = defer();

        def.promise.then(function() {
            calls++
        });
        def.resolve();
        def.promise.then(function() {
            calls++
        }).then(function() {
            calls++
        }).then(function() {
            Promise.delay(11).then(function() {
                assert.equal(calls, 3);
                done();
            });
        });
    });
});
