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

function connect() {
    return _connect().disposer("close");
}

function connectCloseError() {
    return _connect().disposer("closeError");
}

function connectNoSuchMethod() {
    return _connect().disposer("nosuchmethod");
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
