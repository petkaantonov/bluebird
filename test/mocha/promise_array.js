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

    it("rejects after any constituent promise is rejected", function () {
        var toResolve = Promise.defer(); // never resolve
        var toReject = Promise.defer();
        var promises = [toResolve.promise, toReject.promise];
        var promise = Promise.all(promises);

        toReject.reject(new Error("Rejected"));

        promise.caught(function(e){
            //Unhandled rejection
        });

        return Promise.delay(250)
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

    it("sends { index, value } progress updates", function () {
        var deferred1 = Promise.defer();
        var deferred2 = Promise.defer();

        var progressValues = [];

        Promise.delay(50).then(function () {
            deferred1.progress("a");
        });
        Promise.delay(100).then(function () {
            deferred2.progress("b");
            deferred2.resolve();
        });
        Promise.delay(150).then(function () {
            deferred1.progress("c");
            deferred1.resolve();
        });

        return Promise.all([deferred1.promise, deferred2.promise]).then(
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

    specify("should resolve empty input", function(done) {
        return Promise.all([]).then(
            function(result) {
                assert.deepEqual(result, []);
                done()
            }, assert.fail
        );
    });

    specify("should resolve values array", function(done) {
        var input = [1, 2, 3];
        Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, input);
                done()
            }, assert.fail
        );
    });

    specify("should resolve promises array", function(done) {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done()
            }, assert.fail
        );
    });

    specify("should not resolve sparse array input", function(done) {
        var input = [, 1, , 1, 1 ];
        Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, [void 0, 1, void 0, 1, 1]);
                done()
            }, assert.fail
        );
    });

    specify("should reject if any input promise rejects", function(done) {
        var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
        Promise.all(input).then(
            assert.fail,
            function(err) {
                assert.deepEqual(err, 2);
                done();
            }
        );
    });

    specify("should accept a promise for an array", function(done) {
        var expected, input;

        expected = [1, 2, 3];
        input = Promise.resolve(expected);

        Promise.all(input).then(
            function(results) {
                assert.deepEqual(results, expected);
                done()
            }, assert.fail
        );
    });

    specify("should reject when input promise does not resolve to array", function(done) {
        Promise.all(Promise.resolve(1)).caught(TypeError, function(e){
            done();
        });
    });

});
