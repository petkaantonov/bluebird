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

    specify("should have same order as if 2.3.2 was implemented as adoption", function() {
        var order = [];
        var resolveFollower;
        var follower = new Promise(function() {
            resolveFollower = arguments[0];
        });

        follower.then(function() {
            order.push(1);
        });

        var resolveFollowee;
        var followee = new Promise(function() {
            resolveFollowee = arguments[0];
        });

        followee.then(function() {
            order.push(2);
        });

        resolveFollower(followee);

        followee.then(function() {
            order.push(3);
        });

        resolveFollowee();

        return follower.then(function() {
            order.push(4);
            assert.equal(order.join(","), "2,3,1,4");
        });
    });

    specify("github-513", function() {
        var order = [];
        order.push(1);
        var a = Promise.resolve([1]).each(function() {
            order.push(4);
        });
        order.push(2);
        var b = Promise.resolve([1]).map(function() {
            order.push(5);
        });
        order.push(3);
        return Promise.resolve().then(function() {
            assert.deepEqual([1, 2, 3, 4, 5], order);
        });
    });
});
