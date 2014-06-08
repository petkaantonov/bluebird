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
p = pending().constructor.prototype;
p.resolve = p.fulfill;
p.notify = p.progress;

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

function fakeResolved(val) {
    return {
        then: function(callback) {
            return fakeResolved(callback ? callback(val) : val);
        }
    };
}

function fakeRejected(reason) {
    return {
        then: function(callback, errback) {
            return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
        }
    };
}

describe("when.join-test", function () {



    specify("should resolve empty input", function(done) {
        return when.join().then(
            function(result) {
                assert.deepEqual(result, []);
                done();
            },
            fail
        );
    });

    specify("should join values", function(done) {
        when.join(1, 2, 3).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done();
            },
            fail
        );
    });

    specify("should join promises array", function(done) {
        when.join(resolved(1), resolved(2), resolved(3)).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3]);
                done();
            },
            fail
        );
    });

    specify("should join mixed array", function(done) {
        when.join(resolved(1), 2, resolved(3), 4).then(
            function(results) {
                assert.deepEqual(results, [1, 2, 3, 4]);
                done();
            },
            fail
        );
    });

    specify("should reject if any input promise rejects", function(done) {
        when.join(resolved(1), rejected(2), resolved(3)).then(
            fail,
            function(failed) {
                assert.deepEqual(failed, 2);
                done();
            }
        );
    });

    specify("should call last argument as a spread function", function(done) {
        when.join(resolved(1), resolved(2), resolved(3), function(a, b, c) {
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });
    });


    specify("gh-227", function(done) {
        function a() {
            return when.join(when.resolve(1), function () {
                throw new Error();
            });
        }

        a().caught(function(e) {
            done();
        });
    });

});
