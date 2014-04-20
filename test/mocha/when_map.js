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
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map input promises array", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map mixed input array", function(done) {
        var input = [1, resolved(2), 3];
        when.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map input when mapper returns a promise", function(done) {
        var input = [1,2,3];
        when.map(input, deferredMapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should accept a promise for an array", function(done) {
        when.map(resolved([1, resolved(2), 3]), mapper).then(
            function(result) {
                assert.deepEqual(result, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should resolve to empty array when input promise does not resolve to an array", function(done) {
        when.map(resolved(123), mapper).caught(TypeError, function(e){
            done();
        });
    });

    specify("should map input promises when mapper returns a promise", function(done) {
        var input = [resolved(1),resolved(2),resolved(3)];
        when.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should reject when input contains rejection", function(done) {
        var input = [resolved(1), reject(2), resolved(3)];
        when.map(input, mapper).then(
            fail,
            function(result) {
                assert( result === 2 );
                done();
            }
        );
    });

    specify("should propagate progress", function(done) {
        var input = [1, 2, 3];
        var donecalls = 0;
        function donecall() {
            if( ++donecalls === 3 ) done();
        }

        when.map(input, function(x) {
            var d = when.pending();
            d.progress(x);
            setTimeout(d.fulfill.bind(d, x), 0);
            return d.promise;
        }).then(null, null, function(update) {
            assert(update.value === input.shift());
            donecall();
        });
    });

    specify("should propagate progress 2", function(done) {
         // Thanks @depeele for this test
        var input, ncall;

        input = [_resolver(1), _resolver(2), _resolver(3)];
        ncall = 0;

        function identity(x) {
            return x;
        }
        //This test didn't contain the mapper argument so I assume
        //when.js uses identity mapper in such cases.
        //In bluebird it's illegal to call Promise.map without mapper function
        return when.map(input, identity).then(function () {
            assert(ncall === 6);
            done();
        }, fail, function () {
            ncall++;
        });

        function _resolver(id) {
          var p = when.defer();

          setTimeout(function () {
            var loop, timer;

            loop = 0;
            timer = setInterval(function () {
              p.notify(id);
              loop++;
              if (loop === 2) {
                clearInterval(timer);
                p.resolve(id);
              }
            }, 1);
          }, 0);

          return p.promise;
        }

    });
});

describe("when.map-test with concurrency", function () {

    var concurrency = {concurrency: 2};

    function mapper(val) {
        return val * 2;
    }

    function deferredMapper(val) {
        return delay(mapper(val), Math.random()*10);
    }

    specify("should map input values array with concurrency", function(done) {
        var input = [1, 2, 3];
        when.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map input promises array with concurrency", function(done) {
        var input = [resolved(1), resolved(2), resolved(3)];
        when.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map mixed input array with concurrency", function(done) {
        var input = [1, resolved(2), 3];
        when.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should map input when mapper returns a promise with concurrency", function(done) {
        var input = [1,2,3];
        when.map(input, deferredMapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should accept a promise for an array with concurrency", function(done) {
        when.map(resolved([1, resolved(2), 3]), mapper, concurrency).then(
            function(result) {
                assert.deepEqual(result, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should resolve to empty array when input promise does not resolve to an array with concurrency", function(done) {
        when.map(resolved(123), mapper, concurrency).caught(TypeError, function(e){
            done();
        });
    });

    specify("should map input promises when mapper returns a promise with concurrency", function(done) {
        var input = [resolved(1),resolved(2),resolved(3)];
        when.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
                done();
            },
            fail
        );
    });

    specify("should reject when input contains rejection with concurrency", function(done) {
        var input = [resolved(1), reject(2), resolved(3)];
        when.map(input, mapper, concurrency).then(
            fail,
            function(result) {
                assert( result === 2 );
                done();
            }
        );
    });

    specify("should propagate progress with concurrency", function(done) {
        var input = [1, 2, 3];
        var donecalls = 0;
        function donecall() {
            if( ++donecalls === 3 ) done();
        }

        when.map(input, function(x) {
            var d = when.pending();
            d.progress(x);
            setTimeout(d.fulfill.bind(d, x), 0);
            return d.promise;
        }, concurrency).then(null, null, function(update) {
            assert(update.value === input.shift());
            donecall();
        });
    });

    specify("should propagate progress 2 with concurrency", function(done) {
         // Thanks @depeele for this test
        var input, ncall;

        input = [_resolver(1), _resolver(2), _resolver(3)];
        ncall = 0;

        function identity(x) {
            return x;
        }
        //This test didn't contain the mapper argument so I assume
        //when.js uses identity mapper in such cases.
        //In bluebird it's illegal to call Promise.map without mapper function
        return when.map(input, identity, concurrency).then(function () {
            assert(ncall === 6);
            done();
        }, fail, function () {
            ncall++;
        });

        function _resolver(id) {
          var p = when.defer();

          setTimeout(function () {
            var loop, timer;

            loop = 0;
            timer = setInterval(function () {
              p.notify(id);
              loop++;
              if (loop === 2) {
                clearInterval(timer);
                p.resolve(id);
              }
            }, 1);
          }, 0);

          return p.promise;
        }

    });


    specify("should not have more than 5 promises in flight", function(done) {
        var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var b = [];
        var delay = when.delay;
        var wasEmpty = false;
        var now = Date.now();
        when.map(array, function(value, index) {
            var d = index > 4 ? 0 : 100;
            return delay(d).then(function() {
                b.push(value);
            });
        }, {concurrency: 5}).then(function() {
            assert(wasEmpty);
            assert.deepEqual(b, [0, 1, 2, 3, 4, 10, 9, 8, 7, 6, 5]);
            done();
        });

        delay(33).then(function() {
            wasEmpty = b.length === 0;
        });
    });
});
