var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("regressions", function() {
    specify("should be able to call .then more than once inside that promise's handler", function() {
        var called = 0;
        var resolve;
        var promise = new Promise(function() {
            resolve = arguments[0];
        });
        return new Promise(function(resolve) {
            promise.then(function() {
                called++;
                promise.then(function(){
                    called++;
                });
                promise.then(function(){
                    called++;
                    assert.equal(4, called);
                    resolve();
                });
            });

            promise.then(function() {
                called++;
            });

            setTimeout(resolve, 1);
        });

    });

    specify("should be able to nest arbitrary amount of then handlers on already resolved promises", function() {
        var called = 0;
        var resolve;
        var promise = Promise.resolve();
        return new Promise(function(resolve) {
            promise.then(function() {
                called++;
                promise.then(function(){
                    called++;
                    promise.then(function(){
                        called++;
                    });
                    promise.then(function(){
                        called++;
                    });
                });
                promise.then(function(){
                    promise.then(function(){
                        called++;
                    });
                    promise.then(function(){
                        called++;
                        assert.equal(8, called);
                        resolve();
                    });
                    called++;
                });
            });

            promise.then(function() {
                called++;
            });
        });
    });

    specify("github-682", function() {
        var o = {
            then: function(f) {
                setTimeout(function() {
                    delete o.then;
                    f(o);
                }, 1);
            }
        };

        return Promise.resolve(o).then(function(value) {
            assert.equal(o, value);
        });
    });
});
