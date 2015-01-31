"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


var getValues = function() {
    var d = Promise.defer();
    var f = Promise.resolve(3);
    var r = Promise.reject(3);

    setTimeout(function(){
        d.resolve(3);
    }, 1);

    return {
        value: 3,
        thenableFulfill: {then: function(fn){setTimeout(function(){fn(3)}, 1);}},
        thenableReject: {then: function(_, fn){setTimeout(function(){fn(3)}, 1);}},
        promiseFulfilled: f,
        promiseRejected: r,
        promiseEventual: d.promise
    };
};

function expect(count, callback) {
    var cur = 0;
    return new Promise(function() {

    });
}

function expect(count, done) {
    var total = 0;
    return function() {
        total++;
        if (total >= count) {
        }
    }
}

describe("Promise.resolve", function() {
    specify("follows thenables and promises", function() {
        var values = getValues();
        var async = false;
        var ret = Promise.all([
            Promise.resolve(values.value).then(testUtils.noop),
            Promise.resolve(values.thenableFulfill).then(testUtils.noop),
            Promise.resolve(values.thenableReject).then(assert.fail, testUtils.noop),
            Promise.resolve(values.promiseFulfilled).then(testUtils.noop),
            Promise.resolve(values.promiseRejected).then(assert.fail, testUtils.noop),
            Promise.resolve(values.promiseEventual).then(testUtils.noop)
        ]).then(function(v) {
            assert.deepEqual(v, [3, 3, 3, 3, 3, 3]);
            assert(async);
        });
        async = true;
        return ret;
    });
});

describe("Cast thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function() {
        var promise = Promise.cast(a);

        return promise.then(assert.fail).caught(Promise.TypeError, function(){
        });
    });

    specify("rejects with itself", function() {
        var promise = Promise.cast(b);

        return promise.then(assert.fail, function(v){
           assert(v === b);
        });
    });
});

describe("Implicitly cast thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function() {
        return Promise.resolve().then(function(){
            return a;
        }).caught(Promise.TypeError, function(){
        });
    });

    specify("rejects with itself", function() {
        return Promise.resolve().then(function(){
            return b;
        }).then(assert.fail, function(v){
            assert(v === b);
        });
    });
});




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
describe("propagation", function () {

    it("propagate through then with no callback", function () {
        return Promise.resolve(10)
        .then()
        .then(function (ten) {
            assert.equal(ten,10);
        });
    });

    it("propagate through then with modifying callback", function () {
        return Promise.resolve(10)
        .then(function (ten) {
            return ten + 10;
        })
        .then(function (twen) {
            assert.equal(twen,20);
        });
    });

    it("errback recovers from exception", function () {
        var error = new Error("Bah!");
        return Promise.reject(error)
        .then(null, function (_error) {
            assert.equal(_error,error);
            return 10;
        })
        .then(function (value) {
            assert.equal(value,10);
        });
    });

    it("rejection propagates through then with no errback", function () {
        var error = new Error("Foolish mortals!");
        return Promise.reject(error)
        .then()
        .then(null, function (_error) {
            assert.equal(_error,error);
        });
    });

    it("rejection intercepted and rethrown", function () {
        var error = new Error("Foolish mortals!");
        var nextError = new Error("Silly humans!");
        return Promise.reject(error)
        .caught(function () {
            throw nextError;
        })
        .then(null, function (_error) {
            assert.equal(_error,nextError);
        });
    });

    it("resolution is forwarded through deferred promise", function () {
        var a = Promise.defer();
        var b = Promise.defer();
        a.resolve(b.promise);
        b.resolve(10);
        return a.promise.then(function (eh) {
            assert.equal(eh, 10);
        });
    });

    it("should propagate progress by default", function () {
        var d = Promise.defer();

        var progressValues = [];
        var promise = d.promise
        .then()
        .then(
            function () {
                assert.deepEqual(progressValues, [1]);
            },
            function () {
                assert.equal(true,false);
            },
            function (progressValue) {
                progressValues.push(progressValue);
            }
        );

        d.progress(1);
        d.resolve();

        return promise;
    });

    it("should allow translation of progress in the progressback", function () {
        var d = Promise.defer();

        var progressValues = [];
        var promise = d.promise
        .progressed(function (p) {
            return p + 5;
        })
        .then(
            function () {
                assert.deepEqual(progressValues, [10]);
            },
            function () {
                assert.equal(true,false);
            },
            function (progressValue) {
                progressValues.push(progressValue);
            }
        );

        d.progress(5);
        d.resolve();

        return promise;
    });

    //Addiotion: It should NOT but it was actually unspecced what should be the value
    it("should NOT stop progress propagation if an error is thrown", function () {
        var def = Promise.defer();
        var e = new Error("boo!");
        var p2 = def.promise.progressed(function () {
            throw e
        });

        Promise.onerror = function () { /* just swallow it for this test */ };

        var progressValues = [];
        var result = p2.then(
            function () {
                assert.deepEqual(progressValues, [e]);
            },
            function () {
                assert.equal(true,false);
            },
            function (progressValue) {
                progressValues.push(progressValue);
            }
        );

        def.progress();
        def.resolve();
        return result;
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
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var sentinel = {};
var other = {};
describe("Promise.defer-test", function () {


    specify("should fulfill with an immediate value", function() {
        var d = Promise.defer();
        d.resolve(sentinel);
        return d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
            },
            assert.fail
        );
    });

    specify("should return a promise for the resolution value", function() {
        var d = Promise.defer();

        d.resolve(sentinel);
        return d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
            },
            assert.fail
        );
    });

    specify("should return a promise for a promised resolution value", function() {
        var d = Promise.defer();

        d.resolve(Promise.resolve(sentinel))
        return d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
            },
            assert.fail
        );
    });

    specify("should return a promise for a promised rejection value", function() {
        var d = Promise.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.resolve(Promise.reject(sentinel))
        return d.promise.then(
            assert.fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
            }
        );
    });

    specify("should invoke newly added callback when already resolved", function() {
        var d = Promise.defer();

        d.resolve(sentinel);

        return d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
            },
            assert.fail
        );
    });



    specify("should reject with an immediate value", function() {
        var d = Promise.defer();
        d.reject(sentinel);
        return d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, sentinel);
            }
        );
    });

    specify("should reject with fulfilled promised", function() {
        var d, expected;

        d = Promise.defer();
        expected = testUtils.fakeResolved(sentinel);

        var ret = d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, expected);
            }
        );

        d.reject(expected);
        return ret;
    });

    specify("should reject with rejected promise", function() {
        var d, expected;

        d = Promise.defer();
        expected = testUtils.fakeRejected(sentinel);

        var ret = d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, expected);
            }
        );

        d.reject(expected);
        return ret;
    });


    specify("should return a promise for the rejection value", function() {
        var d = Promise.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.reject(sentinel);
        return d.promise.then(
            assert.fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
            }
        );
    });

    specify("should invoke newly added errback when already rejected", function() {
        var d = Promise.defer();

        d.reject(sentinel);

        return d.promise.then(
            assert.fail,
            function (val) {
                assert.deepEqual(val, sentinel);
            }
        );
    });



    specify("should notify of progress updates", function() {
        var d = Promise.defer();

        var ret = d.promise.then(
            assert.fail,
            assert.fail,
            function(val) {
                assert.equal(val, sentinel);
                ret._resolveCallback();
            }
        );

        d.progress(sentinel);
        return ret;
    });

    specify("should propagate progress to downstream promises", function() {
        var d = Promise.defer();

        var ret =  d.promise
        .then(assert.fail, assert.fail,
            function(update) {
                return update;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );

        d.progress(sentinel);
        return ret;
    });

    specify("should propagate transformed progress to downstream promises", function() {
        var d = Promise.defer();

        var ret = d.promise
        .then(assert.fail, assert.fail,
            function() {
                return sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );

        d.progress(other);
        return ret;
    });

    specify("should propagate caught exception value as progress", function() {
        var d = Promise.defer();

        var ret = d.promise
        .then(assert.fail, assert.fail,
            function() {
                throw sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );

        d.progress(other);
        return ret;
    });

    specify("should forward progress events when intermediary callback (tied to a resolved promise) returns a promise", function() {
        var d, d2;

        d = Promise.defer();
        d2 = Promise.defer();

        // resolve d BEFORE calling attaching progress handler
        d.resolve();

        var ret = d.promise.then(
            function() {
                var ret = Promise.defer();
                setTimeout(function(){
                    ret.progress(sentinel);
                }, 1)
                return ret.promise;
            }
        ).then(null, null,
            function onProgress(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );
        return ret;
    });

    specify("should forward progress events when intermediary callback (tied to an unresovled promise) returns a promise", function() {
        var d = Promise.defer();

        var ret = d.promise.then(
            function() {
                var ret = Promise.defer();
                setTimeout(function(){
                    ret.progress(sentinel);
                }, 1)
                return ret.promise;
            }
        ).then(null, null,
            function onProgress(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );

        // resolve d AFTER calling attaching progress handler
        d.resolve();
        return ret;
    });

    specify("should forward progress when resolved with another promise", function() {
        var d, d2;

        d = Promise.defer();
        d2 = Promise.defer();

        var ret = d.promise
        .then(assert.fail, assert.fail,
            function() {
                return sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                ret._resolveCallback();
            }
        );

        d.resolve(d2.promise);

        d2.progress();
        return ret;
    });

    specify("should allow resolve after progress", function() {
        var d = Promise.defer();

        var progressed = false;
        var ret = d.promise.then(
            function() {
                assert(progressed);
            },
            assert.fail,
            function() {
                progressed = true;
            }
        );

        d.progress();
        d.resolve();
        return ret;
    });

    specify("should allow reject after progress", function() {
        var d = Promise.defer();

        var progressed = false;
        var ret = d.promise.then(
            assert.fail,
            function() {
                assert(progressed);
            },
            function() {
                progressed = true;
            }
        );

        d.progress();
        d.reject();
        return ret;
    });

    specify("should be indistinguishable after resolution", function() {
        var d, before, after;

        d = Promise.defer();

        before = d.progress(sentinel);
        d.resolve();
        after = d.progress(sentinel);

        assert.equal(before, after);
    });

    specify("should return silently on progress when already resolved", function() {
        var d = Promise.defer();
        d.resolve();

        assert(undefined === d.progress());
    });

    specify("should return silently on progress when already rejected", function() {
        var d = Promise.defer();
        d.reject();
        d.promise.then(assert.fail, function(){});
        assert(undefined === d.progress());
    });
});

describe("Promise.fromNode", function() {
    specify("rejects thrown errors from resolver", function() {
        var err = new Error();
        return Promise.fromNode(function(callback) {
            throw err;
        }).then(assert.fail, function(e) {
            assert.strictEqual(err, e);
        });
    });
    specify("rejects rejections as operational errors", function() {
        var err = new Error();
        return Promise.fromNode(function(callback) {
            callback(err);
        }).caught(Promise.OperationalError, function(e) {
            assert.strictEqual(err, e.cause);
        });
    });
    specify("resolves normally", function() {
        var result = {};
        return Promise.fromNode(function(callback) {
            callback(null, result);
        }).then(function(res) {
            assert.strictEqual(result, res);
        });
    });
    specify("resolves with bound thunk", function() {
        var nodeFn = function(param, cb) {
            setTimeout(function() {
                cb(null, param);
            }, 1);
        };

        return Promise.fromNode(nodeFn.bind(null, 1)).then(function(res) {
            assert.strictEqual(1, res);
        });
    });
});
