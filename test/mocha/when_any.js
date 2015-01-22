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
var when = adapter;
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

var RangeError = when.RangeError;


describe("when.any-test", function () {

    specify("should reject on empty input array", function(done) {
        var a = [];
        when.any(a).caught(RangeError, function() {
            done();
        });
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
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        when.any(input).then(
            function(result) {
                assert(contains([1, 2, 3], result));
                done();
            }, fail
        );
    });

    specify("should reject with all rejected input values if all inputs are rejected", function(done) {
        var input = [Promise.reject(1), Promise.reject(2), Promise.reject(3)];
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
        input = Promise.resolve(expected);

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
        when.any(Promise.resolve(1)).caught(TypeError, function(e){
            done();
        });
    });

    specify("should reject when given immediately rejected promise", function(done) {
        var err = new Error();
        Promise.any(Promise.reject(err)).caught(function(e) {
            assert.strictEqual(err, e);
            done();
        });
    });
});
