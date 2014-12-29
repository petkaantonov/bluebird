var Promise = adapter;
var assert = require("assert");

describe("regressions", function() {
    specify("should be able to call .then more than once inside that promise's handler", function(done) {
        var called = 0;
        var resolve;
        var promise = new Promise(function() {
            resolve = arguments[0];
        });

        promise.then(function() {
            called++;
            promise.then(function(){
                called++;
            });
            promise.then(function(){
                called++;
                assert.equal(4, called);
                done();
            });
        });

        promise.then(function() {
            called++;
        });

        setTimeout(resolve, 10);
    });

    specify("should be able to nest arbitrary amount of then handlers on already resolved promises", function(done) {
        var called = 0;
        var resolve;
        var promise = Promise.resolve();

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
                    done();
                });
                called++;
            });
        });

        promise.then(function() {
            called++;
        });
    });

    specify("should have same order as if 2.3.2 was implemented as adoption", function(done) {
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

        follower.then(function() {
            order.push(4);
            assert.equal(order.join(","), "2,3,1,4");
            done();
        });
    })
});
