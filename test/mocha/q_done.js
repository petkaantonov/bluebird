"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var Promise = fulfilled().constructor;



var Q = function(p) {
    if( p == null ) return fulfilled(p)
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

Q.delay = Promise.delay;;

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

Q.isPending = function( p ) {
    return p.isPending();
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

var isNodeJS = typeof process !== "undefined" &&
    typeof process.execPath === "string";


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
describe("done", function () {
    var errCount = 0;

    var safeError = new Error("safe_error");



    describe("when the promise is fulfilled", function () {
        describe("and the callback does not throw", function () {
            it("should call the callback and return nothing", function () {
                var called = false;
                var promise = Q();

                var returnValue = promise.done(function () {
                    called = true;
                });

                return promise.caught(function () { }).lastly(function () {
                    assert.equal(called,true);
                    assert.equal(returnValue,undefined);
                });
            });
        });

        if( isNodeJS ) {
            describe("and the callback throws", function () {
                it("should rethrow that error in the next turn and return nothing", function () {
                    var originalException;
                    while( originalException = process.listeners('uncaughtException').pop() ) {
                        process.removeListener('uncaughtException', originalException);
                    }
                    var e;
                    process.on("uncaughtException", function(er){
                        if( er !== safeError ) {
                            console.log(er.stack);
                            process.exit(-1);
                        }
                        e = er;
                    });
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Q().done(
                        function () {
                            throw safeError;
                        }
                    );

                    setTimeout(function first() {
                        assert.equal(turn,1);
                        assert.equal(e, safeError);
                        assert.equal(returnValue,undefined);
                        deferred.resolve();
                    }, 4);
                    var deferred = Q.defer();
                    Q.delay(100).then(deferred.reject);

                    return deferred.promise;
                });
            });
        }
    });


    describe("when the promise is rejected", function () {
        describe("and the errback handles it", function () {
            it("should call the errback and return nothing", function () {
                var called = false;

                var promise = Q.reject("unsafe_error");

                var returnValue = promise.done(
                    function () { },
                    function () {
                        called = true;
                    }
                );

                return promise.caught(function () { }).lastly(function () {
                    assert.equal(called,true);
                    assert.equal(returnValue,undefined);
                });
            });
        });

        if( isNodeJS ) {
            describe("and the errback throws", function () {
                it("should rethrow that error in the next turn and return nothing", function () {
                    var originalException;
                    while( originalException = process.listeners('uncaughtException').pop() ) {
                        process.removeListener('uncaughtException', originalException);
                    }
                    var e;
                    process.on("uncaughtException", function(er){
                        if( er !== safeError ) {
                            console.log(er.stack);
                            process.exit(-1);
                        }

                        e = er;
                    });
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Q.reject("unsafe_error").done(
                        null,
                        function () {
                            throw safeError;
                        }
                    );

                    setTimeout(function second() {
                        assert.equal(turn,1);
                        assert.equal(e, safeError);
                        assert.equal(returnValue,undefined);
                        deferred.resolve();
                    }, 4);
                    var deferred = Q.defer();
                    Q.delay(100).then(deferred.reject);

                    return deferred.promise;
                });
            });


            describe("and there is no errback", function () {
                it("should throw the original error in the next turn", function () {
                    var originalException;
                    while( originalException = process.listeners('uncaughtException').pop() ) {
                        process.removeListener('uncaughtException', originalException);
                    }
                    var e;
                    process.on("uncaughtException", function(er){
                        if( er !== safeError ) {
                            console.log(er.stack);
                            process.exit(-1);
                        }

                        e = er;
                    });
                    var turn = 0;
                    process.nextTick(function () {
                        ++turn;
                    });

                    var returnValue = Q.reject(safeError).done();

                    setTimeout(function third() {
                        assert.equal(turn,1);
                        assert.equal(e, safeError);
                        assert.equal(returnValue,undefined);
                        deferred.resolve();
                    }, 4);
                    var deferred = Q.defer();
                    Q.delay(100).then(deferred.reject);

                    return deferred.promise;
                });
            });
        }
    });

    it("should attach a progress listener", function () {
        var sinon = require("sinon");
        var deferred = Q.defer();

        var spy = sinon.spy();
        deferred.promise.done(null, null, spy);

        deferred.notify(10);
        deferred.resolve();

        return deferred.promise.then(function () {
            sinon.assert.calledWith(spy, sinon.match.same(10));
        });
    });

});
