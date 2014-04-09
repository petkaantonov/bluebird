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
when.resolve = resolved;
when.reject = rejected;
when.defer = pending;
var sentinel = {};
var other = {};
var p = new when(function(){}).constructor.prototype;

function fail() {
    assert.fail();
}

var refute = {
    defined: function(val) {
        assert( typeof val === "undefined" );
    },

    equals: function( a, b ) {
        assert.notDeepEqual( a, b );
    }
};

function contains(arr, result) {
    return arr.indexOf(result) > -1;
}


describe("when.any-test", function () {

    specify("should resolve to empty array with empty input array", function(done) {
        var a = [];
        when.any(a).then(
            function(result) {
                assert(result !== a);
                assert.deepEqual(result, []);
                done();
            }, fail
        );
    });

    specify("should resolve with an input value", function(done) {
        var input = [1, 2, 3];
        when.any(input).then(
            function(result) {
                assert(contains(input, result));
                done();
            }, fail
        );
    });

    specify("should resolve with a promised input value", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.any(input).then(
            function(result) {
                assert(contains([1, 2, 3], result));
                done();
            }, fail
        );
    });

    specify("should reject with all rejected input values if all inputs are rejected", function(done) {
        var input = [rejected(1), rejected(2), rejected(3)];
        var promise = when.any(input);

        promise.then(
            fail,
            function(result) {
                //Cannot use deep equality in IE8 because non-enumerable properties are not
                //supported
                assert(result[0] === 1);
                assert(result[1] === 2);
                assert(result[2] === 3);
                done();
            }
        );
    });

    specify("should accept a promise for an array", function(done) {
        var expected, input;

        expected = [1, 2, 3];
        input = resolved(expected);

        when.any(input).then(
            function(result) {
                refute.equals(expected.indexOf(result), -1);
                done();
            }, fail
        );
    });

    specify("should allow zero handlers", function(done) {
        var input = [1, 2, 3];
        when.any(input).then(
            function(result) {
                assert(contains(input, result));
                done();
            }, fail
        );
    });

    specify("should resolve to empty array when input promise does not resolve to array", function(done) {
        when.any(resolved(1)).caught(TypeError, function(e){
            done();
        });
    });
});
