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
var Promise = adapter;
var resolved = Promise.fulfilled;
var rejected = Promise.rejected;
var reject = rejected;
var resolve = resolved;
Promise.resolve = resolved;
Promise.reject = rejected;
Promise.defer = pending;
var sentinel = {};
var other = {};
var p = new Promise(function(){}).constructor.prototype;
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
    var p = Promise.pending();
    setTimeout(function () {
        p.fulfill(val);
    }, ms);
    return p.promise
};

describe("Promise.reduce-test", function () {

    function plus(sum, val) {
        return sum + val;
    }

    function later(val) {
        return delay(val, Math.random() * 10);
    }


    specify("should reduce values without initial value", function(done) {
        Promise.reduce([1,2,3], plus).then(
            function(result) {
                assert.deepEqual(result, 6);
                done();
            },
            fail
        );
    });

    specify("should reduce values with initial value", function(done) {
        Promise.reduce([1,2,3], plus, 1).then(
            function(result) {
                assert.deepEqual(result, 7);
                done();
            },
            fail
        );
    });

    specify("should reduce values with initial promise", function(done) {
        Promise.reduce([1,2,3], plus, resolved(1)).then(
            function(result) {
                assert.deepEqual(result, 7);
                done();
            },
            fail
        );
    });

    specify("should reduce promised values without initial value", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        Promise.reduce(input, plus).then(
            function(result) {
                assert.deepEqual(result, 6);
                done();
            },
            fail
        );
    });

    specify("should reduce promised values with initial value", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        Promise.reduce(input, plus, 1).then(
            function(result) {
                assert.deepEqual(result, 7);
                done();
            },
            fail
        );
    });

    specify("should reduce promised values with initial promise", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        Promise.reduce(input, plus, resolved(1)).then(
            function(result) {
                assert.deepEqual(result, 7);
                done();
            },
            fail
        );
    });

    specify("should reduce empty input with initial value", function(done) {
        var input = [];
        Promise.reduce(input, plus, 1).then(
            function(result) {
                assert.deepEqual(result, 1);
                done();
            },
            fail
        );
    });

    specify("should reduce empty input with eventual promise", function(done) {
        Promise.reduce([], plus, Promise.delay(1, 50)).then(
            function(result) {
                assert.deepEqual(result, 1);
                done();
            },
            fail
        );
    });

    specify("should reduce empty input with initial promise", function(done) {
        Promise.reduce([], plus, resolved(1)).then(
            function(result) {
                assert.deepEqual(result, 1);
                done();
            },
            fail
        );
    });

    specify("should reject Promise input contains rejection", function(done) {
        var input = [resolved(1), reject(2), resolved(3)];
        Promise.reduce(input, plus, resolved(1)).then(
            fail,
            function(result) {
                assert.deepEqual(result, 2);
                done();
            }
        );
    });

    specify("should reduce to undefined with empty array", function(done) {
        Promise.reduce([], plus).then(function(r){
            assert(r === void 0);
            done();
        });
    });

    specify("should reduce to initial value with empty array", function(done) {
        Promise.reduce([], plus, sentinel).then(function(r){
            assert(r === sentinel);
            done();
        });
    });

    specify("should reduce in input order", function(done) {
        Promise.reduce([later(1), later(2), later(3)], plus, '').then(
            function(result) {
                assert.deepEqual(result, '123');
                done();
            },
            fail
        );
    });

    specify("should accept a promise for an array", function(done) {
        Promise.reduce(resolved([1, 2, 3]), plus, '').then(
            function(result) {
                assert.deepEqual(result, '123');
                done();
            },
            fail
        );
    });

    specify("should resolve to initialValue Promise input promise does not resolve to an array", function(done) {
        Promise.reduce(resolved(123), plus, 1).caught(TypeError, function(e){
            done();
        });
    });

    specify("should provide correct basis value", function(done) {
        function insertIntoArray(arr, val, i) {
            arr[i] = val;
            return arr;
        }

        Promise.reduce([later(1), later(2), later(3)], insertIntoArray, []).then(
            function(result) {
                assert.deepEqual(result, [1,2,3]);
                done();
            },
            fail
        );
    });

    describe("checks", function() {
        function later(val, ms) {
            return Promise.delay(val, ms);
        }

        function plus(sum, val) {
            return sum + val;
        }

        function plusDelayed(sum, val) {
            return Promise.delay(0).then(function() {
                return sum + val;
            });
        }

        function check(delay1, delay2, delay3) {
          return Promise.reduce([
            later(1, delay1),
            later(2, delay2),
            later(3, delay3)
          ], plus, '').then(function(result) {
            assert.deepEqual(result, '123');
          })
        }

        function checkDelayed(delay1, delay2, delay3) {
          return Promise.reduce([
            later(1, delay1),
            later(2, delay2),
            later(3, delay3)
          ], plusDelayed, '').then(function(result) {
            assert.deepEqual(result, '123');
          })
        }

        specify("16, 16, 16", function(done) {
            check(16, 16, 16).then(function() {
                done();
            });
        });

        specify("16, 16, 4", function (done) {
            check(16, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 16, 16", function (done) {
            check(4, 16, 16).then(function () {
                done();
            });
        });
        specify("16, 4, 16", function (done) {
            check(16, 4, 16).then(function () {
                done();
            });
        });
        specify("16, 16, 4", function (done) {
            check(16, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 4, 16", function (done) {
            check(4, 4, 16).then(function () {
                done();
            });
        });
        specify("16, 4, 4", function (done) {
            check(16, 4, 4).then(function () {
                done();
            });
        });
        specify("4, 16, 4", function (done) {
            check(4, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 4, 4", function (done) {
            check(4, 4, 4).then(function () {
                done();
            });
        });


        specify("16, 16, 16", function(done) {
            checkDelayed(16, 16, 16).then(function() {
                done();
            });
        });

        specify("16, 16, 4", function (done) {
            checkDelayed(16, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 16, 16", function (done) {
            checkDelayed(4, 16, 16).then(function () {
                done();
            });
        });
        specify("16, 4, 16", function (done) {
            checkDelayed(16, 4, 16).then(function () {
                done();
            });
        });
        specify("16, 16, 4", function (done) {
            checkDelayed(16, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 4, 16", function (done) {
            checkDelayed(4, 4, 16).then(function () {
                done();
            });
        });
        specify("16, 4, 4", function (done) {
            checkDelayed(16, 4, 4).then(function () {
                done();
            });
        });
        specify("4, 16, 4", function (done) {
            checkDelayed(4, 16, 4).then(function () {
                done();
            });
        });
        specify("4, 4, 4", function (done) {
            checkDelayed(4, 4, 4).then(function () {
                done();
            });
        });

    })
});
