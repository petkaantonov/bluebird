"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var Promise = fulfilled().constructor;


var Q = function(p) {
    if( p.then ) return p;
    return fulfilled(p);
};

Q.progress = function(p, cb) {
    return Q(p).then(null, null, cb);
};

Q.when = function() {
    return Q(arguments[0]).then(arguments[1], arguments[2], arguments[3]);
};

Q.delay = Promise.delay;

Q.defer = function() {
    var ret = pending();
    return {
        reject: function(a){
            return ret.reject(a)
        },
        resolve: function(a) {
            return ret.fulfill(a);
        },

        notify: function(a) {
            return ret.progress(a);
        },

        promise: ret.promise
    };
};

Q.all = Promise.all;

/*!
 *
Copyright 2009–2012 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
describe("all", function () {
    it("fulfills when passed an empty array", function () {
        return Q.all([]);
    });

    it("rejects after any constituent promise is rejected", function () {
        var toResolve = Q.defer(); // never resolve
        var toReject = Q.defer();
        var promises = [toResolve.promise, toReject.promise];
        var promise = Q.all(promises);

        toReject.reject(new Error("Rejected"));

        promise.caught(function(e){
            //Unhandled rejection
        });

        return Q.delay(250)
            .then(function () {
                assert.equal(promise.isRejected(), true);
            })
            .timeout(1000);


    });

    it("resolves foreign thenables", function () {
        var normal = Q(1);
        var foreign = { then: function (f) { f(2); } };

        return Q.all([normal, foreign])
        .then(function (result) {
            assert.deepEqual(result,[1, 2]);
        });
    });


    it("fulfills when passed an sparse array", function () {
        var toResolve = Q.defer();
        var promises = [];
        promises[0] = Q(0);
        promises[2] = toResolve.promise;
        var promise = Q.all(promises);

        toResolve.resolve(2);

        return promise.then(function (result) {
            assert.deepEqual(result, [0, void 0, 2]);
        });
    });

    it("sends { index, value } progress updates", function () {
        var deferred1 = Q.defer();
        var deferred2 = Q.defer();

        var progressValues = [];

        Q.delay(50).then(function () {
            deferred1.notify("a");
        });
        Q.delay(100).then(function () {
            deferred2.notify("b");
            deferred2.resolve();
        });
        Q.delay(150).then(function () {
            deferred1.notify("c");
            deferred1.resolve();
        });

        return Q.all([deferred1.promise, deferred2.promise]).then(
            function () {
                assert.deepEqual(progressValues, [
                    { index: 0, value: "a" },
                    { index: 1, value: "b" },
                    { index: 0, value: "c" }
                ]);
            },
            undefined,
            function (progressValue) {
                progressValues.push(progressValue);
            }
        )
    });

});
