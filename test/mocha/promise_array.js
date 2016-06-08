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
describe("all", function () {
    it("fulfills when passed an empty array", function () {
        return Promise.all([]);
    });

    if (testUtils.ecmaScript6Collections) {
        it("supports iterables", function () {
            return Promise.all(new Set([1, 2, 3])).then(function(v) {
                assert.deepEqual([1,2,3].sort(), v.sort());
            });
        });
    }

    it("rejects after any constituent promise is rejected", function () {
        var toResolve = Promise.defer(); // never resolve
        var toReject = Promise.defer();
        var promises = [toResolve.promise, toReject.promise];
        var promise = Promise.all(promises);

        toReject.reject(new Error("Rejected"));

        promise.then(assert.fail, function(e){
            //Unhandled rejection
        });

        return Promise.delay(1)
            .then(function () {
                assert.equal(promise.isRejected(), true);
            })
            .timeout(1000);


    });

    it("resolves foreign thenables", function () {
        var normal = Promise.resolve(1);
        var foreign = { then: function (f) { f(2); } };

        return Promise.all([normal, foreign])
        .then(function (result) {
            assert.deepEqual(result,[1, 2]);
        });
    });


    it("fulfills when passed an sparse array", function () {
        var toResolve = Promise.defer();
        var promises = [];
        promises[0] = Promise.resolve(0);
        promises[2] = toResolve.promise;
        var promise = Promise.all(promises);

        toResolve.resolve(2);

        return promise.then(function (result) {
            assert.deepEqual(result, [0, void 0, 2]);
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
describe("Promise.all-test", function () {

    specify("should resolve empty input", function() {
        return Promise.all([]).then(
            function(result) {
                assert.deepEqual(result, []);
            }, assert.fail
        );
    });

    specify("should resolve values array", function() {
        var input = [1, 2, 3];
        return Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, input);
            }, assert.fail
        );
    });

    specify("should resolve promises array", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
            }, assert.fail
        );
    });

    specify("should not resolve sparse array input", function() {
        var input = [, 1, , 1, 1 ];
        return Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, [void 0, 1, void 0, 1, 1]);
            }, assert.fail
        );
    });

    specify("should reject if any input promise rejects", function() {
        var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
        return Promise.all(input).then(
            assert.fail,
            function(err) {
                assert.deepEqual(err, 2);
            }
        );
    });

    specify("should accept a promise for an array", function() {
        var expected, input;

        expected = [1, 2, 3];
        input = Promise.resolve(expected);

        return Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, expected);
            }, assert.fail
        );
    });

    specify("should reject when input promise does not resolve to array", function() {
        return Promise.all(Promise.resolve(1)).caught(TypeError, function(e){
        });
    });

});
