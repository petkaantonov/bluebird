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

describe("when.settle-test", function () {


    when.promise = function( rs ){
        var a = pending();
        rs(a);
        return a.promise;
    };


    specify("should settle empty array", function(done) {
        return when.settle([]).then(function(settled) {
            assert.deepEqual(settled.length, 0);
            done();
        });
    });

    specify("should reject if promise for input array rejects", function(done) {
        return when.settle(when.reject(sentinel)).then(
            fail,
            function(reason) {
                assert.equal(reason, sentinel);
                done();
            }
        );
    });

    specify("should settle values", function(done) {
        var array = [0, 1, sentinel];
        return when.settle(array).then(function(settled) {
            assertFulfilled(settled[0], 0);
            assertFulfilled(settled[1], 1);
            assertFulfilled(settled[2], sentinel);
            done();
        });
    });

    specify("should settle promises", function(done) {
        var array = [0, when.resolve(sentinel), when.reject(sentinel)];
        return when.settle(array).then(function(settled) {
            assertFulfilled(settled[0], 0);
            assertFulfilled(settled[1], sentinel);
            assertRejected(settled[2], sentinel);
            done();
        });
    });

    specify("returned promise should fulfill once all inputs settle", function(done) {
        var array, p1, p2, resolve, reject;

        p1 = when.promise(function(r) { resolve = function(a){r.fulfill(a);}; });
        p2 = when.promise(function(r) { reject = function(a){r.reject(a);}; });

        array = [0, p1, p2];

        setTimeout(function() { resolve(sentinel); }, 0);
        setTimeout(function() { reject(sentinel); }, 0);

        return when.settle(array).then(function(settled) {
            assertFulfilled(settled[0], 0);
            assertFulfilled(settled[1], sentinel);
            assertRejected(settled[2], sentinel);
            done();
        });
    });
});
