"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
/*!
 *
Copyright 2009–2012 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

describe("spread", function () {
    it("spreads values across arguments", function () {
        return Promise.resolve([1, 2, 3]).spread(function (a, b) {
            assert.equal(b,2);
        });
    });

    it("spreads promises for arrays across arguments", function () {
        return Promise.resolve([Promise.resolve(10)])
        .all()
        .spread(function (value) {
            assert.equal(value,10);
        });
    });

    it("spreads arrays of promises across arguments", function () {
        var deferredA = Promise.defer();
        var deferredB = Promise.defer();

        var promise = Promise.resolve([deferredA.promise, deferredB.promise]).all().spread(
                               function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });

        Promise.delay(1).then(function () {
            deferredA.resolve(10);
        });
        Promise.delay(1).then(function () {
            deferredB.resolve(20);
        });

        return promise;
    });

    it("spreads arrays of thenables across arguments", function () {
        var p1 = {
            then: function(v) {
                v(10);
            }
        };
        var p2 = {
            then: function(v) {
                v(20);
            }
        };

        var promise = Promise.resolve([p1, p2]).all().spread(function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });
        return promise;
    });

    it("should wait for promises in the returned array even when not calling .all", function() {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        setTimeout(function(){
            d1.resolve(1);
            d2.resolve(2);
            d3.resolve(3);
        }, 1);
        return Promise.resolve().then(function(){
            return [d1.promise, d2.promise, d3.promise];
        }).all().spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for thenables in the returned array even when not calling .all", function() {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 1);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 1);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 1);
            }
        };
        return Promise.resolve().then(function(){
            return [t1, t2, t3];
        }).all().spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for promises in an array that a returned promise resolves to even when not calling .all", function() {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        var defer = Promise.defer();

        setTimeout(function(){
            defer.resolve([d1.promise, d2.promise, d3.promise]);
            setTimeout(function(){
                d1.resolve(1);
                d2.resolve(2);
                d3.resolve(3);
            }, 1);
        }, 1);

        return Promise.resolve().then(function(){
            return defer.promise;
        }).all().spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should wait for thenables in an array that a returned thenable resolves to even when not calling .all", function() {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 1);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 1);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 1);
            }
        };

        var thenable = {
            then: function(fn) {
                setTimeout(function(){
                    fn([t1, t2, t3])
                }, 1);
            }
        };

        return Promise.resolve().then(function(){
            return thenable;
        }).all().spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
        });
    });

    it("should reject with error when non array is the ultimate value to be spread", function(){
        return Promise.resolve().then(function(){
            return 3
        }).spread(function(a, b, c){
            assert.fail();
        }).then(assert.fail, function(e){
        })
    });

    specify("gh-235", function() {
        var P = Promise;
        return P.resolve(1).then(function(x) {
          return [x, P.resolve(2)]
        }).spread(function(x, y) {
          return P.all([P.resolve(3), P.resolve(4)]);
        }).then(function(a) {
          assert.deepEqual([3, 4], a);
        });
    })

    specify("error when passed non-function", function() {
        return Promise.resolve(3)
                .spread()
                .then(assert.fail)
                .caught(Promise.TypeError, function() {});
    });

    specify("error when resolution is non-spredable", function() {
        return Promise.resolve(3)
                .spread(function(){})
                .then(assert.fail)
                .caught(Promise.TypeError, function() {});
    });
});

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

describe("Promise.spread-test", function () {
    var slice = [].slice;

    specify("should return a promise", function() {
        assert(typeof (Promise.defer().promise.spread(function(){}).then) === "function");
    });

    specify("should apply onFulfilled with array as argument list", function() {
        var expected = [1, 2, 3];
        return Promise.resolve(expected).spread(function() {
            assert.deepEqual(slice.call(arguments), expected);
        });
    });

    specify("should resolve array contents", function() {
        var expected = [Promise.resolve(1), 2, Promise.resolve(3)];
        return Promise.resolve(expected).all().spread(function() {
            assert.deepEqual(slice.call(arguments), [1, 2, 3]);
        });
    });

    specify("should reject if any item in array rejects", function() {
        var expected = [Promise.resolve(1), 2, Promise.reject(3)];
        return Promise.resolve(expected).all()
            .spread(assert.fail)
            .then(assert.fail, function() {});
    });

    specify("should apply onFulfilled with array as argument list", function() {
        var expected = [1, 2, 3];
        return Promise.resolve(Promise.resolve(expected)).spread(function() {
            assert.deepEqual(slice.call(arguments), expected);
        });
    });

    specify("should resolve array contents", function() {
        var expected = [Promise.resolve(1), 2, Promise.resolve(3)];
        return Promise.resolve(Promise.resolve(expected)).all().spread(function() {
            assert.deepEqual(slice.call(arguments), [1, 2, 3]);
        });
    });

    specify("should reject if input is a rejected promise", function() {
        var expected = Promise.reject([1, 2, 3]);
        return Promise.resolve(expected)
            .spread(assert.fail)
            .then(assert.fail, function() {});
    });
});
