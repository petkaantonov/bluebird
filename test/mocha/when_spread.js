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
var reject = rejected;
var resolve = resolved;
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

function assertFulfilled(p, v) {
    assert( p.value() === v );
}

function assertRejected(p, v) {
    assert( p.error() === v );
}

var delay = function (val, ms) {
    var p = when.pending();
    setTimeout(function () {
        p.fulfill(val);
    }, ms);
    return p.promise
};

describe("when.spread-test", function () {
    var slice = [].slice;

    specify("should return a promise", function(done) {
        assert( typeof (when.defer().promise.spread().then) === "function");
        done();
    });

    specify("should apply onFulfilled with array as argument list", function(done) {
        var expected = [1, 2, 3];
        return when.resolve(expected).spread(function() {
            assert.deepEqual(slice.call(arguments), expected);
            done();
        });
    });

    specify("should resolve array contents", function(done) {
        var expected = [when.resolve(1), 2, when.resolve(3)];
        return when.resolve(expected).spread(function() {
            assert.deepEqual(slice.call(arguments), [1, 2, 3]);
            done();
        });
    });

    specify("should reject if any item in array rejects", function(done) {
        var expected = [when.resolve(1), 2, when.reject(3)];
        return when.resolve(expected)
            .spread(fail)
            .then(fail, function() { done();});
    });

    specify("should apply onFulfilled with array as argument list", function(done) {
        var expected = [1, 2, 3];
        return when.resolve(when.resolve(expected)).spread(function() {
            assert.deepEqual(slice.call(arguments), expected);
            done();
        });
    });

    specify("should resolve array contents", function(done) {
        var expected = [when.resolve(1), 2, when.resolve(3)];
        return when.resolve(when.resolve(expected)).spread(function() {
            assert.deepEqual(slice.call(arguments), [1, 2, 3]);
            done();
        });
    });

    specify("should reject if input is a rejected promise", function(done) {
        var expected = when.reject([1, 2, 3]);
        return when.resolve(expected)
            .spread(fail)
            .then(fail, function() { done();});
    });
});
