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

var adapter = require("../../js/bluebird_debug.js");
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
var p = new when().constructor.prototype;
p.ensure = function(fn){
    return this.lastly(function(){
        fn();
    });
};

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
var delay = function (val, ms) {
    var p = when.pending();
    setTimeout(function () {
        p.fulfill(val);
    }, ms);
    return p.promise
};

describe("when.map-test", function () {

    function mapper(val) {
        return val * 2;
    }

    function deferredMapper(val) {
        return delay(mapper(val), Math.random()*10);
    }

    specify("should map input values array", function(done) {
        var input = [1, 2, 3];
        when.map(input, mapper).then(
            function(results) {
                assert.equals(results, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should map input promises array", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.map(input, mapper).then(
            function(results) {
                assert.equals(results, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should map mixed input array", function(done) {
        var input = [1, resolved(2), 3];
        when.map(input, mapper).then(
            function(results) {
                assert.equals(results, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should map input when mapper returns a promise", function(done) {
        var input = [1,2,3];
        when.map(input, deferredMapper).then(
            function(results) {
                assert.equals(results, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should accept a promise for an array", function(done) {
        when.map(resolved([1, resolved(2), 3]), mapper).then(
            function(result) {
                assert.equals(result, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should resolve to empty array when input promise does not resolve to an array", function(done) {
        when.map(resolved(123), mapper).then(
            function(result) {
                assert.equals(result, []);
            },
            fail
        ).ensure(done);
    });

    specify("should map input promises when mapper returns a promise", function(done) {
        var input = [resolved(1),resolved(2),resolved(3)];
        when.map(input, mapper).then(
            function(results) {
                assert.equals(results, [2,4,6]);
            },
            fail
        ).ensure(done);
    });

    specify("should reject when input contains rejection", function(done) {
        var input = [resolved(1), reject(2), resolved(3)];
        when.map(input, mapper).then(
            fail,
            function(result) {
                assert.equals(result, 2);
            }
        ).ensure(done);
    });

    specify("should propagate progress", function(done) {
        var input = [1, 2, 3];

        when.map(input, function(x) {
            var d = when.pending();
            d.progress(x);
            setTimeout(d.fulfill.bind(d, x), 0);
            return d.promise;
        }).then(null, null,
            function(update) {
                assert.equals(update, input.shift());
            }
        ).ensure(done);
    });


});