"use strict";
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

describe("Promise.join-test", function () {



    specify("should resolve empty input", function(done) {
        return Promise.join().then(
            function(result) {
                assert.deepEqual(result, []);
                done();
            },
            assert.fail
        );
    });

    specify("should join values", function(done) {
        Promise.join(1, 2, 3).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done();
            },
            assert.fail
        );
    });

    specify("should join promises array", function(done) {
        Promise.join(Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done();
            },
            assert.fail
        );
    });

    specify("should join mixed array", function(done) {
        Promise.join(Promise.resolve(1), 2, Promise.resolve(3), 4).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3, 4]);
                done();
            },
            assert.fail
        );
    });

    specify("should reject if any input promise rejects", function(done) {
        Promise.join(Promise.resolve(1), Promise.reject(2), Promise.resolve(3)).then(
            assert.fail,
            function(err) {
                assert.deepEqual(err, 2);
                done();
            }
        );
    });

    specify("should call last argument as a spread function", function(done) {
        Promise.join(Promise.resolve(1), Promise.resolve(2), Promise.resolve(3), function(a, b, c) {
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });
    });


    specify("gh-227", function(done) {
        function a() {
            return Promise.join(Promise.resolve(1), function () {
                throw new Error();
            });
        }

        a().caught(function(e) {
            done();
        });
    });

    specify("should not pass the callback as argument, <5 arguments", function(done) {
        Promise.join(1, 2, 3, function() {
            assert.strictEqual(arguments.length, 3);
            done();
        });
    });

    specify("should not pass the callback as argument >5 arguments", function(done) {
        Promise.join(1, 2, 3, 4, 5, 6, 7, function() {
            assert.strictEqual(arguments.length, 7);
            done();
        });
    });

});
