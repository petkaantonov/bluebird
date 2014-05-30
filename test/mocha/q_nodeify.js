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

var sinon = require("sinon");


var isNodeJS = typeof process !== "undefined" &&
    typeof process.execPath === "string";


/*
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

describe("nodeify", function () {

    it("calls back with a resolution", function () {
        var spy = sinon.spy();
        Q(10).nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, null, 10);
        }, 100);
    });

    it("calls back with an undefined resolution", function (done) {
        var spy = sinon.spy();
        Q().nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWithExactly(spy, null);
            done();
        }, 10);
    });

    it("calls back with an error", function () {
        var spy = sinon.spy();
        Q.reject(10).nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 10);
        }, 100);
    });

    it("forwards a promise", function () {
        return Q(10).nodeify().then(function (ten) {
            assert(10 === ten);
        });
    });

    it("returns undefined when a callback is passed", function () {
        return 'undefined' === typeof Q(10).nodeify(function () {});
    });

});


//Should be the last test because it is ridiculously hard to test
//if something throws in the node process

if( isNodeJS ) {
    describe("nodeify", function () {

        var h = [];

        function clearHandlers() {
            var originalException;
            while( originalException = process.listeners('uncaughtException').pop() ) {
                process.removeListener('uncaughtException', originalException);
                h.push(originalException);
            }
        }

        function clearHandlersNoRestore() {
            var originalException;
            while( originalException = process.listeners('uncaughtException').pop() ) {
                process.removeListener('uncaughtException', originalException);
            }
        }

        function addHandlersBack() {
            for( var i = 0, len = h.length; i < len; ++i ) {
                process.addListener('uncaughtException', h[i]);
            }
        }
        var e = new Error();
        function thrower() {
            throw e;
        }

        it("throws normally in the node process if the function throws", function (done) {
            clearHandlers();
            var promise = Q(10);
            var turns = 0;
            process.nextTick(function(){
                turns++;
            });
            promise.nodeify(thrower);
            process.addListener("uncaughtException", function(err) {
                clearHandlersNoRestore();
                assert( err === e );
                assert( turns === 1);
                done();
            });
        });

        it("always returns promise for now", function(done){
            Promise.resolve(3).nodeify().then(function() {
                var a = 0;
                Promise.resolve(3).nodeify(function(){
                    a++;
                }).then(function(){
                    assert(1 == 1);
                    done();
                });
            })
        });

        it("should spread arguments with spread option", function(done) {
            Promise.resolve([1,2,3]).nodeify(function(err, a, b, c) {
                assert(err === null);
                assert(a === 1);
                assert(b === 2);
                assert(c === 3);
                done();
            }, {spread: true});
        });
    });
}
