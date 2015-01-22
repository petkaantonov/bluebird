"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


var getValues = function() {
    var d = Promise.defer();
    var f = Promise.resolve(3);
    var r = Promise.reject(3);

    setTimeout(function(){
        d.resolve(3);
    }, 40);

    return {
        value: 3,
        thenableFulfill: {then: function(fn){setTimeout(function(){fn(3)}, 40);}},
        thenableReject: {then: function(_, fn){setTimeout(function(){fn(3)}, 40);}},
        promiseFulfilled: f,
        promiseRejected: r,
        promiseEventual: d.promise
    };
};

function expect(count, done) {
    var total = 0;
    return function() {
        total++;
        if (total >= count) {
            done();
        }
    }
}

describe("Promise.resolve", function() {
    specify("follows thenables and promises", function(done) {
        done = expect(6, done);
        var values = getValues();
        var async = false;

        function onFulfilled(v) {
            assert(v === 3);
            assert(async);
            done();
        }

        Promise.resolve(values.value).then(onFulfilled);
        Promise.resolve(values.thenableFulfill).then(onFulfilled);
        Promise.resolve(values.thenableReject).then(assert.fail, onFulfilled);
        Promise.resolve(values.promiseFulfilled).then(onFulfilled);
        Promise.resolve(values.promiseRejected).then(assert.fail, onFulfilled);
        Promise.resolve(values.promiseEventual).then(onFulfilled);
        async = true;
    });
});

describe("PromiseResolver.resolve", function() {
    specify("follows thenables and promises", function(done) {
        done = expect(6, done);
        var values = getValues();
        var async = false;

        function onFulfilled(v) {
            assert(v === 3);
            assert(async);
            done();
        }

        var d1 = Promise.defer();
        var d2 = Promise.defer();
        var d3 = Promise.defer();
        var d4 = Promise.defer();
        var d5 = Promise.defer();
        var d6 = Promise.defer();

        d1.resolve(values.value);
        d1.promise.then(onFulfilled);
        d2.resolve(values.thenableFulfill);
        d2.promise.then(onFulfilled);
        d3.resolve(values.thenableReject);
        d3.promise.then(assert.fail, onFulfilled);
        d4.resolve(values.promiseFulfilled);
        d4.promise.then(onFulfilled);
        d5.resolve(values.promiseRejected);
        d5.promise.then(assert.fail, onFulfilled);
        d6.resolve(values.promiseEventual);
        d6.promise.then(onFulfilled);
        async = true;
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

    specify("fulfills with itself", function(done) {
        var promise = Promise.cast(a);

        promise.then(assert.fail).caught(Promise.TypeError, function(){
            done();
        });
    });

    specify("rejects with itself", function(done) {
        var promise = Promise.cast(b);

        promise.caught(function(v){
           assert(v === b);
           done();
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

    specify("fulfills with itself", function(done) {
        Promise.resolve().then(function(){
            return a;
        }).caught(Promise.TypeError, function(){
            done();
        });
    });

    specify("rejects with itself", function(done) {
        Promise.resolve().then(function(){
            return b;
        }).caught(function(v){
            assert(v === b);
            done();
        });
    });
});

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


describe("PromiseResolver.callback", function () {

    it("fulfills a promise with a single callback argument", function (done) {
        var resolver = Promise.defer();
        resolver.callback(null, 10);
        resolver.promise.then(function (value) {
            assert(value === 10);
            done();
        });
    });

    it("fulfills a promise with multiple callback arguments", function (done) {
        var resolver = Promise.defer();
        resolver.callback(null, 10, 20);
        resolver.promise.then(function (value) {
            assert.deepEqual(value, [ 10, 20 ]);
            done();
        });
    });

    it("rejects a promise", function (done) {
        var resolver = Promise.defer();
        var exception = new Error("Holy Exception of Anitoch");
        resolver.callback(exception);
        resolver.promise.then(assert.fail, function (_exception) {
            assert(exception === _exception.cause);
            done();
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


    specify("should fulfill with an immediate value", function(done) {
        var d = Promise.defer();

        d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
                done();
            },
            assert.fail
        );

        d.resolve(sentinel);
    });

    specify("should return a promise for the resolution value", function(done) {
        var d = Promise.defer();

        d.resolve(sentinel);
        d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            },
            assert.fail
        );
    });

    specify("should return a promise for a promised resolution value", function(done) {
        var d = Promise.defer();

        d.resolve(Promise.resolve(sentinel))
        d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            },
            assert.fail
        );
    });

    specify("should return a promise for a promised rejection value", function(done) {
        var d = Promise.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.resolve(Promise.reject(sentinel))
        d.promise.then(
            assert.fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            }
        );
    });

    specify("should invoke newly added callback when already resolved", function(done) {
        var d = Promise.defer();

        d.resolve(sentinel);

        d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
                done();
            },
            assert.fail
        );
    });



    specify("should reject with an immediate value", function(done) {
        var d = Promise.defer();

        d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );

        d.reject(sentinel);
    });

    specify("should reject with fulfilled promised", function(done) {
        var d, expected;

        d = Promise.defer();
        expected = testUtils.fakeResolved(sentinel);

        d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, expected);
                done();
            }
        );

        d.reject(expected);
    });

    specify("should reject with rejected promise", function(done) {
        var d, expected;

        d = Promise.defer();
        expected = testUtils.fakeRejected(sentinel);

        d.promise.then(
            assert.fail,
            function(val) {
                assert.equal(val, expected);
                done();
            }
        );

        d.reject(expected);
    });


    specify("should return a promise for the rejection value", function(done) {
        var d = Promise.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.reject(sentinel);
        d.promise.then(
            assert.fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            }
        );
    });

    specify("should invoke newly added errback when already rejected", function(done) {
        var d = Promise.defer();

        d.reject(sentinel);

        d.promise.then(
            assert.fail,
            function (val) {
                assert.deepEqual(val, sentinel);
                done();
            }
        );
    });



    specify("should notify of progress updates", function(done) {
        var d = Promise.defer();

        d.promise.then(
            assert.fail,
            assert.fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );

        d.progress(sentinel);
    });

    specify("should propagate progress to downstream promises", function(done) {
        var d = Promise.defer();

        d.promise
        .then(assert.fail, assert.fail,
            function(update) {
                return update;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.progress(sentinel);
    });

    specify("should propagate transformed progress to downstream promises", function(done) {
        var d = Promise.defer();

        d.promise
        .then(assert.fail, assert.fail,
            function() {
                return sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.progress(other);
    });

    specify("should propagate caught exception value as progress", function(done) {
        var d = Promise.defer();

        d.promise
        .then(assert.fail, assert.fail,
            function() {
                throw sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.progress(other);
    });

    specify("should forward progress events when intermediary callback (tied to a resolved promise) returns a promise", function(done) {
        var d, d2;

        d = Promise.defer();
        d2 = Promise.defer();

        // resolve d BEFORE calling attaching progress handler
        d.resolve();

        d.promise.then(
            function() {
                var ret = Promise.defer();
                setTimeout(function(){
                    ret.progress(sentinel);
                }, 0)
                return ret.promise;
            }
        ).then(null, null,
            function onProgress(update) {
                assert.equal(update, sentinel);
                done();
            }
        );
    });

    specify("should forward progress events when intermediary callback (tied to an unresovled promise) returns a promise", function(done) {
        var d = Promise.defer();

        d.promise.then(
            function() {
                var ret = Promise.defer();
                setTimeout(function(){
                    ret.progress(sentinel);
                }, 0)
                return ret.promise;
            }
        ).then(null, null,
            function onProgress(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        // resolve d AFTER calling attaching progress handler
        d.resolve();
    });

    specify("should forward progress when resolved with another promise", function(done) {
        var d, d2;

        d = Promise.defer();
        d2 = Promise.defer();

        d.promise
        .then(assert.fail, assert.fail,
            function() {
                return sentinel;
            }
        )
        .then(assert.fail, assert.fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.resolve(d2.promise);

        d2.progress();
    });

    specify("should allow resolve after progress", function(done) {
        var d = Promise.defer();

        var progressed = false;
        d.promise.then(
            function() {
                assert(progressed);
                done();
            },
            assert.fail,
            function() {
                progressed = true;
            }
        );

        d.progress();
        d.resolve();
    });

    specify("should allow reject after progress", function(done) {
        var d = Promise.defer();

        var progressed = false;
        d.promise.then(
            assert.fail,
            function() {
                assert(progressed);
                done();
            },
            function() {
                progressed = true;
            }
        );

        d.progress();
        d.reject();
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
        d.promise.caught(function(){});
        assert(undefined === d.progress());
    });
});
