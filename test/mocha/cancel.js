"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var delay = Promise.delay;
var CancellationError = Promise.CancellationError;

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
    specify("single-parent", function() {
        var parent = Promise.defer().promise.cancellable();
        var promise = parent.uncancellable();

        parent.then(assert.fail, assert.fail, assert.fail);
        var result = promise.then(assert.fail, assert.fail, assert.fail);
        promise.cancel();
        return Promise.delay(1).then(function() {
            assert.ok(parent.isCancellable());
            assert.ok(!promise.isCancellable());
            assert.ok(parent.isPending());
            assert.ok(promise.isPending());
        });
    });

    specify("2 parents", function() {
        var grandParent = Promise.defer().promise.cancellable();
        var parent = grandParent.then(assert.fail, assert.fail, assert.fail);
        var promise = parent.uncancellable();

        grandParent.then(assert.fail, assert.fail, assert.fail);
        var result = promise.then(assert.fail, assert.fail, assert.fail);
        promise.cancel();
        return Promise.delay(1).then(function() {
            assert.ok(grandParent.isCancellable());
            assert.ok(parent.isCancellable());
            assert.ok(!promise.isCancellable());
            assert.ok(grandParent.isPending());
            assert.ok(parent.isPending());
            assert.ok(promise.isPending());
        });
    });
});

describe("Cancel.1: If the promise is not pending the 'cancel' call has no effect.", function() {
    specify("already-fulfilled", function() {
        var promise = Promise.resolve(sentinel).cancellable();
        var result = promise.then(function(value) {
            assert.strictEqual(value, sentinel);
        }, assert.fail);
        promise.cancel();
        return result;
    });

    specify("already-rejected", function() {
        var promise = Promise.reject(sentinel).cancellable();
        var result = promise.then(assert.fail, function(reason) {
            assert.strictEqual(reason, sentinel);
        });
        promise.cancel();
        return result;
    });
});




describe("Cancel.3: If the promise is pending and waiting on another promise the 'cancel' call should instead propagate to this parent promise but MUST be done asynchronously after this call returns.", function() {
    specify("parent pending", function() {
        var parentCancelled = false;
        var tuple = Promise.defer();
        var parent = tuple.promise.cancellable();
        var unhandled = parent.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            parentCancelled = true;
            throw reason;
        });
        var promise = parent.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assert.ok(parentCancelled);
            unhandled.then(assert.fail, function(){});
        })

        promise.cancel();
        return promise;
    });

    specify("grand parent pending", function() {
        var grandparentCancelled = false;
        var parentCancelled = false;
        var uncleCancelled = false;

        var tuple = Promise.defer();
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
            uncle.then(assert.fail, function(){});
        });
        assert(promise.isCancellable());
        assert(parent.isCancellable());
        assert(grandparent.isCancellable());
        assert(promise._cancellationParent === parent);
        assert(parent._cancellationParent === grandparent);
        promise.cancel();
        return promise;
    });
});

describe("Cancel.4: Otherwise the promise is rejected with a CancellationError.", function() {
    specify("simple", function() {
        var promise = Promise.defer().promise.cancellable();
        var result = promise.then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
        });
        promise.cancel();
        return result;
    });

    specify("then fulfilled assumption", function() {
        var assumed = Promise.defer().promise.cancellable();
        var promise = Promise.resolve().cancellable().then(function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
        });

        promise.cancel();
        return promise;
    });

    specify("then rejected assumption", function() {
        var assumed = Promise.defer().promise.cancellable();

        var promise = Promise.reject().cancellable().then(null, function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
        });

        promise.cancel();
        return promise;
    });


    specify("then chain-fulfilled assumption", function() {
        var assumed = Promise.defer().promise.cancellable();

        var promise = Promise.resolve().cancellable().then(function() {
            return Promise.resolve();
        }).then(function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
        });

        promise.cancel();
        return promise;
    });


    specify("then chain-rejected assumption", function() {
        var assumed = Promise.defer().promise.cancellable();
        var promise = Promise.reject().cancellable().then(null, function() {
            return Promise.reject();
        }).then(null, function() {
            return assumed;
        }).then(assert.fail, function(reason) {
            assert.ok(isCancellationError(reason));
            assertCancelled(assumed);
        });
        promise.cancel();
        return promise;
    });
});

describe("issues", function(){
    specify("gh-166", function() {
        var f1 = false, f2 = false, f3 = false, f4 = false;
        var a = Promise.resolve().cancellable();
        a = a.then(function() {
            f1 = true;
            return Promise.delay(1);
        });

        a = a.then(function() {
            f2 = true;
            return Promise.delay(1);
        });

        a = a.then(function() {
            f3 = true;
            return Promise.delay(1);
        }).then(function() {
            assert(a.isCancellable());
            a.cancel();
        }).delay(1);


        a = a.then(function() {
            f4 = true;
        });

        var waitingForLongDelay = a;

        a = a.caught(Promise.CancellationError, function() {
            assert(f1); assert(f2); assert(f3);
            assertCancelled(waitingForLongDelay);
            assert(!f4);
        });

        assert(a.isCancellable());
        return a;
    });
});

describe("simple", function() {
    specify("should reject with custom error", function() {
        var a = new Promise(function(){}).cancellable();
        var err = new Error();
        a.cancel(err);
        return a.then(assert.fail, function(e) {
            assert(e === err);
        });
    });
    specify("cancellable called on cancellable promise", function() {
        var p = Promise.defer().promise.cancellable();
        var p2 = p.cancellable();
        assert.strictEqual(p, p2);
    });
});

var token = {};
describe("Cancelling a promise twice should have no additional effect", function() {
    specify("With delay", function() {
        var count = 0;
        var promise = Promise.defer().promise
            .cancellable()
            .then(assert.fail, function(){
                return ++count;
            })
            .then(function(val) {
                assert.strictEqual(1, val);
            });
        promise.cancel();
        return Promise.delay(1).then(function() {
            promise.cancel();
            return Promise.delay(1).thenReturn(promise);
        });
    });
    specify("Without delay", function() {
        var count = 0;
        var promise = Promise.defer().promise
            .cancellable()
            .then(assert.fail, function(){
                return ++count;
            })
            .then(function(val) {
                assert.strictEqual(1, val);
            });
        promise.cancel()
        promise.cancel();
        return Promise.delay(1).thenReturn(promise);
    });
});
