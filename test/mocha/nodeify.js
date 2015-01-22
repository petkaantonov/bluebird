"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var processError = testUtils.processError;
var sinon = require("sinon");
var isNodeJS = testUtils.isNodeJS;
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
        Promise.resolve(10).nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, null, 10);
        }, 100);
    });

    it("calls back with an undefined resolution", function (done) {
        var spy = sinon.spy();
        Promise.resolve().nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWithExactly(spy, null);
            done();
        }, 10);
    });

    it("calls back with an error", function () {
        var spy = sinon.spy();
        Promise.reject(10).nodeify(spy);
        setTimeout(function(){
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 10);
        }, 100);
    });

    it("forwards a promise", function () {
        return Promise.resolve(10).nodeify().then(function (ten) {
            assert(10 === ten);
        });
    });

    it("returns undefined when a callback is passed", function () {
        return 'undefined' === typeof Promise.resolve(10).nodeify(function () {});
    });

});


//Should be the last test because it is ridiculously hard to test
//if something throws in the node process

if (isNodeJS) {
    describe("nodeify", function () {
        var h = [];
        var e = new Error();
        function thrower() {
            throw e;
        }

        it("throws normally in the node process if the function throws", function (done) {
            var promise = Promise.resolve(10);
            var turns = 0;
            process.nextTick(function(){
                turns++;
            });
            promise.nodeify(thrower);
            processError(function(err){
                assert(err === e);
                assert(turns === 1);
            }, done)
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

        describe("promise rejected with falsy values", function(done) {
            specify("no reason", function(done) {
                Promise.reject().nodeify(function(err) {
                    assert.strictEqual(arguments.length, 1);
                    assert.strictEqual(err.cause, undefined);
                    done();
                });
            });
            specify("null reason", function(done) {
                Promise.reject(null).nodeify(function(err) {
                    assert.strictEqual(arguments.length, 1);
                    assert.strictEqual(err.cause, null);
                    done();
                });
            });
            specify("nodefying a follewer promise", function(done) {
                new Promise(function(resolve, reject) {
                    resolve(new Promise(function(_, reject) {
                        setTimeout(function() {
                            reject();
                        }, 13);
                    }))
                }).nodeify(function(err) {
                    assert.strictEqual(arguments.length, 1);
                    assert.strictEqual(err.cause, undefined);
                    done();
                });
            });
            specify("nodefier promise becomes follower", function(done) {
                Promise.resolve(1).then(function() {
                    return new Promise(function(_, reject) {
                        setTimeout(function() {
                            reject();
                        }, 13);
                    });
                }).nodeify(function(err) {
                    assert.strictEqual(arguments.length, 1);
                    assert.strictEqual(err.cause, undefined);
                    done();
                });
            });
        });
        it("should wrap arguments with spread option", function(done) {
            Promise.resolve([1,2,3]).nodeify(function(err, a, b, c) {
                assert(err === null);
                assert(a === 1);
                assert(b === 2);
                assert(c === 3);
                done();
            }, {spread: true});
        });

        it("should work then result is not an array", function(done) {
            Promise.resolve(3).nodeify(function(err, a) {
                assert(err === null);
                assert(a === 3);
                done();
            }, {spread: true});
        });

        it("should work if the callback throws when spread", function(done) {
            var err = new Error();
            Promise.resolve([1,2,3]).nodeify(function(_, a) {
                throw err;
            }, {spread: true});

            processError(function(e) {
                assert.strictEqual(err, e);
            }, done);
        });

        it("should work if the callback throws when rejected", function(done) {
            var err = new Error();
            Promise.reject(new Error()).nodeify(function(_, a) {
                throw err;
            });

            processError(function(e) {
                assert.strictEqual(err, e);
            }, done);
        });
    });
}
