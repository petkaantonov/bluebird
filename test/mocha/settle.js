"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
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

describe("allSettled", function () {
    it("works on an empty array", function () {
        return Promise.settle([])
        .then(function (snapshots) {
            assert.deepEqual(snapshots, []);
        });
    });

    it("deals with a mix of non-promises and promises", function () {
        return Promise.settle([1, Promise.resolve(2), Promise.reject(3)])
        .then(function (snapshots) {
            assert.equal(snapshots[0].value(), 1);
            assert.equal(snapshots[1].value(), 2);
            assert.equal(snapshots[2].error(), 3);
        });
    });

    it("is settled after every constituent promise is settled", function () {
        var toFulfill = Promise.defer();
        var toReject = Promise.defer();
        var promises = [toFulfill.promise, toReject.promise];
        var fulfilled;
        var rejected;

        Promise.attempt(function () {
            toReject.reject();
            rejected = true;
        })
        .delay(1)
        .then(function () {
            toFulfill.resolve();
            fulfilled = true;
        });

        return Promise.settle(promises)
        .then(function () {
            assert.equal(fulfilled, true);
            assert.equal(rejected, true);
        });
    });

    it("does not modify the input array", function () {
        var input = [1, Promise.resolve(2), Promise.reject(3)];

        return Promise.settle(input)
        .then(function (snapshots) {
            assert.notEqual(snapshots, input);
            assert.equal(snapshots[0].value(), 1);
            assert.equal(snapshots[1].value(), 2);
            assert.equal(snapshots[2].error(), 3);
        });
    });

});

/*
Based on When.js tests

Open Source Initiative OSI - The MIT License

http://www.opensource.org/licenses/mit-license.php

Copyright (c) 2011 Brian Cavalier

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var sentinel = {};
var other = {};
describe("Promise.settle-test", function () {


    Promise.promise = function(rs){
        var a = Promise.defer();
        rs(a);
        return a.promise;
    };


    specify("should settle empty array", function() {
        return Promise.settle([]).then(function(settled) {
            assert.deepEqual(settled.length, 0);
        });
    });

    specify("should reject if promise for input array rejects", function() {
        return Promise.settle(Promise.reject(sentinel)).then(
            assert.fail,
            function(reason) {
                assert.equal(reason, sentinel);
            }
        );
    });

    specify("should settle values", function() {
        var array = [0, 1, sentinel];
        return Promise.settle(array).then(function(settled) {
            testUtils.assertFulfilled(settled[0], 0);
            testUtils.assertFulfilled(settled[1], 1);
            testUtils.assertFulfilled(settled[2], sentinel);
        });
    });

    specify("should settle promises", function() {
        var array = [0, Promise.resolve(sentinel), Promise.reject(sentinel)];
        return Promise.settle(array).then(function(settled) {
            testUtils.assertFulfilled(settled[0], 0);
            testUtils.assertFulfilled(settled[1], sentinel);
            testUtils.assertRejected(settled[2], sentinel);
        });
    });

    specify("returned promise should fulfill once all inputs settle", function() {
        var array, p1, p2, resolve, reject;

        p1 = Promise.promise(function(r) { resolve = function(a){r.fulfill(a);}; });
        p2 = Promise.promise(function(r) { reject = function(a){r.reject(a);}; });

        array = [0, p1, p2];

        setTimeout(function() { resolve(sentinel); }, 0);
        setTimeout(function() { reject(sentinel); }, 0);

        return Promise.settle(array).then(function(settled) {
            testUtils.assertFulfilled(settled[0], 0);
            testUtils.assertFulfilled(settled[1], sentinel);
            testUtils.assertRejected(settled[2], sentinel);
        });
    });
});
