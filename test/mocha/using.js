"use strict";
var assert = require("assert");

var Promise = require("../../js/debug/bluebird.js");

var using = Promise.using;
var delay = Promise.delay;
var error = new Error("");

function Resource() {
    this.isClosed = false;
    this.closesCalled = 0;
    this.commited = false;
    this.rollbacked = false;
}

Resource.prototype.commit = function () {
    if (this.commited || this.rollbacked) {
        throw new Error("was already commited or rolled back")
    }
    this.commited = true;
};

Resource.prototype.rollback = function () {
    if (this.commited || this.rollbacked) {
        throw new Error("was already commited or rolled back")
    }
    this.rollbacked = true;
};

Resource.prototype.closeAsync = function() {
    return delay(10).bind(this).then(this.close);
};

Resource.prototype.close = function() {
    this.closesCalled++;
    if (this.isClosed) {
        return;
    }
    this.isClosed = true;
};

Resource.prototype.closeError = function() {
    throw error;
};

Resource.prototype.query = function(value) {
    return Promise.delay(value, 50);
};

function _connect() {
    return new Promise(function(resolve) {
        setTimeout(function(){
            resolve(new Resource())
        }, 13);
    });
}

function connectCloseAsync(arr, value) {
    return _connect().disposer(function(resource){
        return resource.closeAsync().then(function() {
            arr.push(value);
        });
    });
}

function connect() {
    return _connect().disposer(Resource.prototype.close);
}

function connectCloseError() {
    return _connect().disposer(Resource.prototype.closeError);
}


function connectError() {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){
            reject(error);
        }, 13);
    });
}

function transactionDisposer(tx, outcome) {
    outcome.isFulfilled() ? tx.commit() : tx.rollback();
}

function transaction() {
    return _connect().disposer(transactionDisposer);
}

describe("Promise.using", function() {
    specify("simple happy case", function(done) {
        var res;

        using(connect(), function(connection){
            res = connection;
        }).then(function() {
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    specify("simple async happy case", function(done) {
        var res;
        var async = false;

        using(connect(), function(connection) {
            res = connection;
            return delay(50).then(function() {
                async = true;
            });
        }).then(function() {
            assert(async);
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    specify("simple unhappy case", function(done) {
        var a = connect();
        var promise = a._promise;
        var b = connectError();
        using(b, a, function(a, b) {
            assert(false);
        }).catch(function() {
            assert(promise.value().isClosed);
            assert.equal(promise.value().closesCalled, 1);
            done();
        })
    });

    specify("calls async disposers sequentially", function(done) {
         var a = [];
         var _res3 = connectCloseAsync(a, 3);
         var _res2 = connectCloseAsync(a, 2);
         var _res1 = connectCloseAsync(a, 1);
         using(_res1, _res2, _res3, function(res1, res2, res3) {
            _res1 = res1;
            _res2 = res2;
            _res3 = res3;
         }).then(function() {
            assert.deepEqual(a, [1,2,3]);
            assert(_res1.isClosed);
            assert(_res2.isClosed);
            assert(_res3.isClosed);
            assert(_res1.closesCalled == 1);
            assert(_res2.closesCalled == 1);
            assert(_res3.closesCalled == 1);
            done();
         });
    });

    specify("calls async disposers sequentially when failing", function(done) {
         var a = [];
         var _res3 = connectCloseAsync(a, 3);
         var _res2 = connectCloseAsync(a, 2);
         var _res1 = connectCloseAsync(a, 1);
         var p1 = _res1.promise();
         var p2 = _res2.promise();
         var p3 = _res3.promise();
         var e = new Error();
         var promise = delay(50).thenThrow(e);
         using(_res1, _res2, _res3, promise, function() {

         }).caught(function(err) {
            assert.deepEqual(a, [1,2,3]);
            assert(p1.value().isClosed);
            assert(p2.value().isClosed);
            assert(p3.value().isClosed);
            assert(p1.value().closesCalled == 1);
            assert(p2.value().closesCalled == 1);
            assert(p3.value().closesCalled == 1);
            assert(e === err)
            done();
         });
    });

    specify("successful transaction", function(done) {
        var _tx;
        using(transaction(), function(tx) {
            _tx = tx;
            return tx.query(1).then(function() {
                return tx.query(2);
            })
        }).then(function(){
            assert(_tx.commited);
            assert(!_tx.rollbacked);
            done();
        });
    });

    specify("fail transaction", function(done) {
        var _tx;
        using(transaction(), function(tx) {
            _tx = tx;
            return tx.query(1).then(function() {
                throw new Error();
            })
        }).then(assert.fail, function(){
            assert(!_tx.commited);
            assert(_tx.rollbacked);
            done();
        });
    });
})

describe("runaway promises use-after-free", function() {
    specify("promise.all", function(done) {
        var usedAfterFree = false;
        function resource() {
            usedAfterFree = true;
        }
        var resource1WasClosed = false;
        var resource1 = Promise.resolve(resource).disposer(function(){
            resource1WasClosed = true;
        });
        var resource2WasClosed = false;
        var resource2 = Promise.resolve(resource).disposer(function(){
            resource2WasClosed = true;
        });
        var err = new Error();
        using(resource1, resource2, function(res1, res2) {
            var c1 = Promise.resolve().then(function() {
                return Promise.delay(0).then(function() {
                    res1();
                    res2();
                });
            });
            c1.delay(0).then(function() {
                // no return statement - context propagation
                // should still work
                Promise.delay(0).then(function() {
                    res1();
                    res2();
                });
            });
            var c2 = Promise.reject(err);
            return Promise.all([c1, c2]);
        }).catch(function(e) {
            // Wait for 50 ms so that if the runaway promises were
            // to use-after-free, they would have plenty of time
            // to do so
            Promise.delay(50).then(function() {
                assert(err === e);
                assert(resource1WasClosed);
                assert(resource2WasClosed);
                assert(!usedAfterFree);
                done();
            });
        });
    });

    specify("nested using statements should track their own promises", function(done) {
        // Upper using
        using(Promise.resolve(), function() {
            var f1, f2;
            var p1 = new Promise(function(f) {f1 = f;});
            var p2;
            // Lower using
            return using(Promise.resolve(), function() {
                p2 = new Promise(function(f) {f2 = f;});
            }).then(function() {
                // p2 is frozen here because the lower using is done by now
                f2(3);
                assert(!p2.isFulfilled());
                // p1 should still work because we are still in the upper using
                f1(3);
                assert(p1.isFulfilled() && p1.value() === 3);

            })
        }).then(function() {
            done();
        });
    });
});
