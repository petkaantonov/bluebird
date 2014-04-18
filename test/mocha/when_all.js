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

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var when = adapter;
var resolved = when.fulfilled;
var rejected = when.rejected;
var p = new when(function(){}).constructor.prototype;

function fail() {
    assert.fail();
}

describe("when.all-test", function () {

    specify("should resolve empty input", function(done) {
        return when.all([]).then(
            function(result) {
                assert.deepEqual(result, []);
                done()
            }, fail
        );
    });

    specify("should resolve values array", function(done) {
        var input = [1, 2, 3];
        when.all(input).then(
            function(results) {
                assert.deepEqual(results, input);
                done()
            }, fail
        );
    });

    specify("should resolve promises array", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.all(input).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done()
            }, fail
        );
    });

    specify("should not resolve sparse array input", function(done) {
        var input = [, 1, , 1, 1 ];
        when.all(input).then(
            function(results) {
                assert.deepEqual(results, [void 0, 1, void 0, 1, 1]);
                done()
            }, fail
        );
    });

    specify("should reject if any input promise rejects", function(done) {
        var input = [resolved(1), rejected(2), resolved(3)];
        when.all(input).then(
            fail,
            function(failed) {
                assert.deepEqual(failed, 2);
                done();
            }
        );
    });

    specify("should accept a promise for an array", function(done) {
        var expected, input;

        expected = [1, 2, 3];
        input = resolved(expected);

        when.all(input).then(
            function(results) {
                assert.deepEqual(results, expected);
                done()
            }, fail
        );
    });

    specify("should reject when input promise does not resolve to array", function(done) {
        when.all(resolved(1)).caught(TypeError, function(e){
            done();
        });
    });

});
