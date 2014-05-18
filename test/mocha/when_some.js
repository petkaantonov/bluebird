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

function isSubset(subset, superset) {
    var i, subsetLen;

    subsetLen = subset.length;

    if (subsetLen > superset.length) {
        return false;
    }

    for(i = 0; i<subsetLen; i++) {
        if(!contains(superset, subset[i])) {
            return false;
        }
    }

    return true;
}

describe("when.some-test", function () {

    specify("should resolve empty input", function(done) {
        when.some([], 1).then(
            function(result) {
                assert.deepEqual(result, []);
                done();
            },
            fail
        )
    });

    specify("should resolve values array", function(done) {
        var input = [1, 2, 3];
        when.some(input, 2).then(
            function(results) {
                assert(isSubset(results, input));
                done();
            },
            fail
        )
    });

    specify("should resolve promises array", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.some(input, 2).then(
            function(results) {
                assert(isSubset(results, [1, 2, 3]));
                done();
            },
            fail
        )
    });

    specify("should not resolve sparse array input", function(done) {
        var input = [, 1, , 2, 3 ];
        when.some(input, 2).then(
            function(results) {
                assert.deepEqual(results, [void 0, 1]);
                done();
            },
            function() {
                console.error(arguments);
                fail();
            }
        )
    });

    specify("should reject with all rejected input values if resolving howMany becomes impossible", function(done) {
        var input = [resolved(1), rejected(2), rejected(3)];
        when.some(input, 2).then(
            fail,
            function(failed) {
                //Cannot use deep equality in IE8 because non-enumerable properties are not
                //supported
                assert(failed[0] === 2);
                assert(failed[1] === 3);
                done();
            }
        )
    });

    specify("should reject with aggregateError", function(done) {
        var input = [resolved(1), rejected(2), rejected(3)];
        var AggregateError = when.AggregateError;
        when.some(input, 2)
            .then(fail)
            .caught(AggregateError, function(e) {
                assert(e[0] === 2);
                assert(e[1] === 3);
                assert(e.length === 2);
                done();
            });
    });

    specify("aggregate error should be caught in .error", function(done) {
        var input = [resolved(1), rejected(2), rejected(3)];
        var AggregateError = when.AggregateError;
        when.some(input, 2)
            .then(fail)
            .error(function(e) {
                assert(e[0] === 2);
                assert(e[1] === 3);
                assert(e.length === 2);
                done();
            });
    });

    specify("should accept a promise for an array", function(done) {
        var expected, input;

        expected = [1, 2, 3];
        input = resolved(expected);

        when.some(input, 2).then(
            function(results) {
                assert.deepEqual(results.length, 2);
                done();
            },
            fail
        )
    });

    specify("should reject when input promise does not resolve to array", function(done) {
        when.some(resolved(1), 1).caught(TypeError, function(e){
            done();
        });
    });
});
