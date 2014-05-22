"use strict";
/*global describe specify require global*/
//TODO include the copyright
    "use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
var delay = Promise.delay;
var CancellationError = adapter.CancellationError;

var sentinel = {
    sentinel: "sentinel"
}; // a sentinel fulfillment value to test for with strict equality
var dummy = {
    dummy: "dummy"
}; // we fulfill or reject with this when we don't intend to test against it

function isCancellationError(error) {
    return error instanceof CancellationError &&
        error.name === "CancellationError";
}

function assertCancelled(promise) {
    assert(promise.isRejected());
    assert(isCancellationError(promise.reason()));
}

describe("If the promise is not cancellable the 'cancel' call has no effect.", function() {
    specify("single-parent", function(done) {
        var parent = pending().promise.cancellable();
        var promise = parent.uncancellable();

        parent.then(assert.fail, assert.fail, assert.fail);
        var result = promise.then(assert.fail, assert.fail, assert.fail);
        promise.cancel();
        setTimeout(function(){
            assert.ok(parent.isCancellable());
            assert.ok(!promise.isCancellable());
            assert.ok(parent.isPending());
            assert.ok(promise.isPending());
            done();
        }, 50)
        return result;
    });

    specify("2 parents", function(done) {
        var grandParent = pending().promise.cancellable();
        var parent = grandParent.then(assert.fail, assert.fail, assert.fail);
        var promise = parent.uncancellable();

        grandParent.then(assert.fail, assert.fail, assert.fail);
        var result = promise.then(assert.fail, assert.fail, assert.fail);
        promise.cancel();
        setTimeout(function(){
            assert.ok(grandParent.isCancellable());
            assert.ok(parent.isCancellable());
            assert.ok(!promise.isCancellable());
            assert.ok(grandParent.isPending());
            assert.ok(parent.isPending());
            assert.ok(promise.isPending());
            done();
        }, 50)
        return result;
    });
});

describe("Cancel.1: If the promise is not pending the 'cancel' call has no effect.", function() {
    specify("already-fulfilled", function(done) {
        var promise = fulfilled(sentinel).cancellable();
        var result = promise.then(function(value) {
            assert.strictEqual(value, sentinel);
            done();
        }, assert.fail);
        promise.cancel();
        return result;
    });

    specify("already-rejected", function(done) {
        var promise = rejected(sentinel).cancellable();
        var result = promise.then(assert.fail, function(reason) {
            assert.strictEqual(reason, sentinel);
            done();
        });
        promise.cancel();
        return result;
    });
});




describe("Cancel.3: If the promise is pending and waiting on another promise the 'cancel' call should instead propagate to this parent promise but MUST be done asynchronously after this call returns.", function() {
    specify("parent pending", function(done) {
        var parentCancelled = false;
        var tuple = pending();
        var parent = tuple.promise.cancellable();
        var unhandled = parent.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            parentCancelled = true;
            throw reason;
        });
        var promise = parent.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assert.ok(parentCancelled);
            done();
            unhandled.caught(function(){});
        })

        promise.cancel();
        return promise;
    });

    specify("grand parent pending", function(done) {
        var grandparentCancelled = false;
        var parentCancelled = false;
        var uncleCancelled = false;

        var tuple = pending();
        var grandparent = tuple.promise.cancellable();


        var uncle = grandparent.then(null, function(reason) {
            throw reason;
        });

        var parent = grandparent.then(assert.fail, function(reason) {
            throw reason;
        });

        var promise = parent.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(parent);
            assertCancelled(uncle);
            assertCancelled(grandparent);
            done();
            uncle.caught(function(){});
        });
        assert(promise.isCancellable());
        assert(parent.isCancellable());
        assert(grandparent.isCancellable());
        assert(promise._cancellationParent === parent);
        assert(parent._cancellationParent === grandparent);
        promise.cancel();
    });
});

describe("Cancel.4: Otherwise the promise is rejected with a CancellationError.", function() {
    specify("simple", function(done) {
        var promise = pending().promise.cancellable();
        var result = promise.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            done();
        });
        promise.cancel();
    });

    specify("then fulfilled assumption", function(done) {
        var assumed = pending().promise.cancellable();
        var promise = fulfilled().cancellable().then(function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
            done();
        });

        promise.cancel();
    });

    specify("then rejected assumption", function(done) {
        var assumed = pending().promise.cancellable();

        var promise = rejected().cancellable().then(null, function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
            done();
        });

        promise.cancel();
    });


    specify("then chain-fulfilled assumption", function(done) {
        var assumed = pending().promise.cancellable();

        var promise = fulfilled().cancellable().then(function() {
            return fulfilled();
        }).then(function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
            done();
        });

        promise.cancel();
    });


    specify("then chain-rejected assumption", function(done) {
        var assumed = pending().promise.cancellable();
        var promise = rejected().cancellable().then(null, function() {
            return rejected();
        }).then(null, function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
            done();
        });
        promise.cancel();
    });
});

describe("issues", function(){
    specify("gh-166", function(done) {
        var f1 = false, f2 = false, f3 = false, f4 = false;
        var a = Promise.resolve().cancellable();
        a = a.then(function() {
            f1 = true;
            return delay(5);
        });

        a = a.then(function() {
            f2 = true;
            return delay(5);
        });

        a = a.then(function() {
            f3 = true;
            return delay(500);
        });

        a = a.then(function() {
            f4 = true;
        });

        var waitingForLongDelay = a;

        a = a.caught(Promise.CancellationError, function() {
            assert(f1); assert(f2); assert(f3);
            assertCancelled(waitingForLongDelay);
            assert(!f4);
            done();
        });

        assert(a.isCancellable());
        setTimeout(function() {
            assert(a.isCancellable());
            a.cancel();
        }, 50);
    });
});

describe("simple", function() {
    specify("should reject with custom error", function(done) {
        var a = new Promise(function(){}).cancellable();
        var err = new Error();
        a.cancel(err);
        a.caught(function(e) {
            assert(e === err);
            done();
        });

    });
});
