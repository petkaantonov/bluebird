"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");

var Promise2 = require("../../js/debug/promise.js")();

var using = Promise.using;
var delay = Promise.delay;
var error = new Error("");
var id = 0;
function Resource() {
    this.isClosed = false;
    this.closesCalled = 0;
    this.commited = false;
    this.rollbacked = false;
    this.id = id++;

}

Resource.prototype.commit = function () {
    if (this.commited || this.rollbacked) {
        throw new Error("was already commited or rolled back")
    }
    this.commited = true;
};

Resource.prototype.commitAsync = function () {
    return Promise.delay(10).bind(this).then(this.commit)
}

Resource.prototype.rollback = function () {
    if (this.commited || this.rollbacked) {
        throw new Error("was already commited or rolled back")
    }
    this.rollbacked = true;
};

Resource.prototype.rollbackAsync = function () {
    return Promise.delay(10).bind(this).then(this.rollback)
}

Resource.prototype.closeAsync = function() {
    return Promise.delay(10).bind(this).then(this.close);
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

function _connect2() {
    return new Promise2(function(resolve) {
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

function promiseForConnectCloseAsync(arr, value) {
    return Promise.delay(10).then(function() {
        return connectCloseAsync(arr, value);
    });
}

function connect() {
    return _connect().disposer(Resource.prototype.close);
}

function connect2() {
    return _connect2().disposer(Resource.prototype.close);
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

function transactionDisposerAsync(tx, outcome) {
    return outcome.isFulfilled() ? tx.commitAsync() : tx.rollbackAsync();
}

function transaction() {
    return _connect().disposer(transactionDisposer);
}

function transactionWithImmediatePromiseAfterConnect() {
    return _connect().then(function (connection) {
      return Promise.resolve(connection).then(function(c) { return c; })
    }).disposer(transactionDisposer);
}

function transactionWithEventualPromiseAfterConnect() {
    return _connect().then(function (connection) {
      return Promise.delay(100).thenReturn(connection);
    }).disposer(transactionDisposer);
}

function transactionAsync() {
    return _connect().disposer(transactionDisposerAsync);
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
            return Promise.delay(50).then(function() {
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
        }).caught(function() {
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

    specify("calls async disposers sequentially when assert.failing", function(done) {
         var a = [];
         var _res3 = connectCloseAsync(a, 3);
         var _res2 = connectCloseAsync(a, 2);
         var _res1 = connectCloseAsync(a, 1);
         var p1 = _res1.promise();
         var p2 = _res2.promise();
         var p3 = _res3.promise();
         var e = new Error();
         var promise = Promise.delay(50).thenThrow(e);
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

    specify("calls promised async disposers sequentially", function(done) {
         var a = [];
         var _res3 = promiseForConnectCloseAsync(a, 3);
         var _res2 = promiseForConnectCloseAsync(a, 2);
         var _res1 = promiseForConnectCloseAsync(a, 1);
         using(_res1, _res2, _res3, function(res1, res2, res3) {
            assert(res1 instanceof Resource)
            assert(res2 instanceof Resource)
            assert(res3 instanceof Resource)
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

    specify("calls promised async disposers sequentially when assert.failing", function(done) {
         var a = [];
         var _res3 = promiseForConnectCloseAsync(a, 3);
         var _res2 = promiseForConnectCloseAsync(a, 2);
         var _res1 = promiseForConnectCloseAsync(a, 1);
         var e = new Error();
         var promise = Promise.delay(50).thenThrow(e);
         using(_res1, _res2, _res3, promise, function() {

         }).caught(function(err) {
            assert.deepEqual(a, [1,2,3]);
            assert(_res1.value().promise().value().isClosed);
            assert(_res2.value().promise().value().isClosed);
            assert(_res3.value().promise().value().isClosed);
            assert(_res1.value().promise().value().closesCalled == 1);
            assert(_res2.value().promise().value().closesCalled == 1);
            assert(_res3.value().promise().value().closesCalled == 1);
            assert(e === err)
            done();
         });
    });

    specify("mixed promise, promise-for-disposer and disposer", function(done) {
         var a = [];
         var _res3 = promiseForConnectCloseAsync(a, 3);
         var _res2 = connectCloseAsync(a, 2);
         var _res1 = Promise.delay(10, 10);
         using(_res1, _res2, _res3, function(res1, res2, res3) {
            assert(res1 === 10);
            assert(res2 instanceof Resource);
            assert(res3 instanceof Resource);
            _res1 = res1;
            _res2 = res2;
            _res3 = res3;
         }).then(function() {
            assert.deepEqual(a, [2,3]);
            assert(_res2.isClosed);
            assert(_res3.isClosed);
            assert(_res2.closesCalled == 1);
            assert(_res3.closesCalled == 1);
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

    specify("successful async transaction", function(done) {
        var _tx;
        using(transactionAsync(), function(tx) {
            _tx = tx;
            return tx.query(1).then(function() {
                return tx.query(3);
            })
        }).then(function(){
            assert(_tx.commited);
            assert(!_tx.rollbacked);
            done();
        })
    })

    specify("successful transaction with an immediate promise before disposer creation", function(done) {
        var _tx;
        using(transactionWithImmediatePromiseAfterConnect(), function(tx) {
            _tx = tx;
            return tx.query(1);
        }).then(function(){
            assert(_tx.commited);
            assert(!_tx.rollbacked);
            done();
        });
    });

    specify("successful transaction with an eventual promise before disposer creation", function(done) {
        var _tx;
        using(transactionWithEventualPromiseAfterConnect(), function(tx) {
            _tx = tx;
            return tx.query(1);
        }).then(function(){
            assert(_tx.commited);
            assert(!_tx.rollbacked);
            done();
        });
    });

    specify("assert.fail transaction", function(done) {
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

    specify("assert.fail async transaction", function(done) {
        var _tx;
        using(transactionAsync(), function(tx) {
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

    specify("with using coming from another Promise instance", function(done) {
        var res;
        Promise2.using(connect(), function(connection){
            res = connection;
        }).then(function() {
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    specify("with using coming from another Promise instance other way around", function(done) {
        var res;
        Promise.using(connect2(), function(connection){
            res = connection;
        }).then(function() {
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    if (testUtils.isNodeJS) {
        specify("disposer throwing should throw in progress", function(done) {
            var err = new Error();
            var disposer = Promise.resolve().disposer(function() {
                throw err;
            });
            Promise.using(disposer, function() {

            }).then(done, done);

            testUtils.processError(function(e) {
                assert.strictEqual(e, err);
            }, done);
        });
    }

    specify("Return rejected promise with less than 2 arguments", function(done) {
        Promise.using(1).caught(Promise.TypeError, function(e) {
            done();
        });
    });

    specify("Throw if disposer is not passed a function", function(done) {
        try {
            Promise.resolve().disposer({});
        } catch (e) {
            return done();
        }
        assert.fail();
    });

    specify("Mixed rejected disposers are not called", function(done) {
        var err = new Error("rejected should not be called");
        var a = Promise.delay(100).thenThrow(err).disposer(function() {
            done(err);
        });
        var b = Promise.delay(50).thenReturn(connect());
        Promise.using(a, b, function() {
            done(new Error("should not be here"));
        }).caught(function(e) {
            assert.strictEqual(b.value()._promise.value().isClosed, true);
            assert.strictEqual(b.value()._promise.value().closesCalled, 1);
            done();
        });
    });

    specify("Return rejected promise when last argument is not function", function(done) {
        Promise.using({}, {}, {}, {}).caught(Promise.TypeError, function(e) {
            done();
        });
    });
})
