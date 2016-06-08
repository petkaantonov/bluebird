var Promise = adapter;
var assert = require("assert");

describe("Github #417", function() {

    specify("minimal repro", function() {
        var promise = new Promise(function(resolve) {
            resolve(Promise.resolve().then(function() {
                return new Promise(function(resolve) {
                    setTimeout(resolve, 1);
                });
            }));
        });

        return promise.then(function() {
            assert(promise.isResolved());
        });
    });

    specify("original repro", function() {
        var called = 0;
        var bar = Promise.method(function() {
            return Promise.bind(this)
                .then(Promise.method(function() {
                    called++;
                }));
        });

        var foo = Promise.method(function() {
            return Promise.bind(this)
                .then(Promise.method(function() {
                    return bar();
                }))
                .bind(this)
                .lastly(Promise.method(function() {
                    called++;
                }));
        });

        return foo().then(function() {
            called++;
            assert.equal(3, called);
        });
    });
});

