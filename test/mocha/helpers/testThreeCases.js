"use strict";

var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

function success(done) {
    return function() {
        done();
    };
}

function fail(done) {
    return function(err) {
        done(err);
    };
}

function handlePromise(val, done) {
    if (val && typeof val.then === "function") {
        val.then(success(done), fail(done));
    }
}

exports.testFulfilled = function (value, test) {
    specify("already-fulfilled", function (done) {
        handlePromise(test(fulfilled(value), done), done);
    });

    specify("immediately-fulfilled", function (done) {
        var tuple = pending();
        handlePromise(test(tuple.promise, done), done);
        tuple.fulfill(value);
    });

    specify("eventually-fulfilled", function (done) {
        var tuple = pending();
        handlePromise(test(tuple.promise, done), done);
        setTimeout(function () {
            tuple.fulfill(value);
        }, 1);
    });
};

exports.testRejected = function (reason, test) {
    specify("already-rejected", function (done) {
        handlePromise(test(rejected(reason), done), done);
    });

    specify("immediately-rejected", function (done) {
        var tuple = pending();
        handlePromise(test(tuple.promise, done), done);
        tuple.reject(reason);
    });

    specify("eventually-rejected", function (done) {
        var tuple = pending();
        handlePromise(test(tuple.promise, done), done);
        setTimeout(function () {
            tuple.reject(reason);
        }, 1);
    });
};
