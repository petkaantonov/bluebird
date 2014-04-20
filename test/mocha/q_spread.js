"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var Promise = fulfilled().constructor;

var Q = function(p) {
    if( p.then ) return p;
    return fulfilled(p);
};

Q.progress = function(p, cb) {
    return Q(p).then(null, null, cb);
};

Q.when = function() {
    return Q(arguments[0]).then(arguments[1], arguments[2], arguments[3]);
};

var freeMs;
function resolver( fulfill ) {
    setTimeout(fulfill, freeMs );
};

Q.delay = Promise.delay;

Q.defer = function() {
    var ret = pending();
    return {
        reject: function(a){
            return ret.reject(a)
        },
        resolve: function(a) {
            return ret.fulfill(a);
        },

        notify: function(a) {
            return ret.progress(a);
        },

        promise: ret.promise
    };
};

Q.reject = Promise.rejected;
Q.resolve = Promise.fulfilled;

Q.allSettled = Promise.settle;

Q.spread = function(){
    return Q(arguments[0]).spread(arguments[1], arguments[2], arguments[3]);
};

Q.fcall= function( fn ) {
    var p = Promise.pending();

    try {
        p.fulfill(fn());
    }
    catch(e){
        p.reject(e);
    }
    return p.promise;
};



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
        return Q.spread([1, 2, 3], function (a, b) {
            assert.equal(b,2);
        });
    });

    it("spreads promises for arrays across arguments", function () {
        return Q([Q(10)])
        .spread(function (value) {
            assert.equal(value,10);
        });
    });

    it("spreads arrays of promises across arguments", function () {
        var deferredA = Q.defer();
        var deferredB = Q.defer();

        var promise = Q.spread([deferredA.promise, deferredB.promise],
                               function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });

        Q.delay(5).then(function () {
            deferredA.resolve(10);
        });
        Q.delay(10).then(function () {
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

        var promise = Q.spread([p1, p2],
                               function (a, b) {
            assert.equal(a,10);
            assert.equal(b,20);
        });
        return promise;
    });

    it("calls the errback when given a rejected promise", function (done) {
        var err = new Error();
        adapter.all([fulfilled(10), rejected(err)]).spread(assert.fail,
            function(actual){
            assert( actual === err );
            done();
        });
    });

    it("should wait for promises in the returned array even when not calling .all", function(done) {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        Promise.resolve().then(function(){
            return [d1.promise, d2.promise, d3.promise];
        }).spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });

        setTimeout(function(){
            d1.resolve(1);
            d2.resolve(2);
            d3.resolve(3);
        }, 13);
    });

    it("should wait for thenables in the returned array even when not calling .all", function(done) {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 13);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 13);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 13);
            }
        };
        Promise.resolve().then(function(){
            return [t1, t2, t3];
        }).spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });
    });

    it("should wait for promises in an array that a returned promise resolves to even when not calling .all", function(done) {
        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        var defer = Promise.defer();
        Promise.resolve().then(function(){
            return defer.promise;
        }).spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });

        setTimeout(function(){
            defer.resolve([d1.promise, d2.promise, d3.promise]);
            setTimeout(function(){
                d1.resolve(1);
                d2.resolve(2);
                d3.resolve(3);
            }, 13);
        }, 13);

    });

    it("should wait for thenables in an array that a returned thenable resolves to even when not calling .all", function(done) {
        var t1 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(1);
                }, 13);
            }
        };
        var t2 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(2);
                }, 13);
            }
        };
        var t3 = {
            then: function(fn) {
                setTimeout(function(){
                    fn(3);
                }, 13);
            }
        };

        var thenable = {
            then: function(fn) {
                setTimeout(function(){
                    fn([t1, t2, t3])
                }, 13);
            }
        };

        Promise.resolve().then(function(){
            return thenable;
        }).spread(function(a, b, c){
            assert(a === 1);
            assert(b === 2);
            assert(c === 3);
            done();
        });
    });

    it("should reject with error when non array is the ultimate value to be spread", function(done){
        Promise.resolve().then(function(){
            return 3
        }).spread(function(a, b, c){
            assert.fail();
        }).caught(function(e){
            done();
        })
    });

});
