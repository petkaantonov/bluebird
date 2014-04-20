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

describe("when.defer-test", function () {


    specify("should fulfill with an immediate value", function(done) {
        var d = when.defer();

        d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
                done();
            },
            fail
        );

        d.resolve(sentinel);
    });

    //Not implemented
    /*
    specify("should fulfill with fulfilled promised", function(done) {
        var d = when.defer();

        d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
                done();
            },
            fail
        );

        d.resolve(fakeResolved(sentinel));
    });


    specify("should reject with rejected promise", function(done) {
        var d = when.defer();

        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );

        d.resolve(fakeRejected(sentinel));
    });
    */
    specify("should return a promise for the resolution value", function(done) {
        var d = when.defer();

        d.resolve(sentinel);
        d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            },
            fail
        );
    });

    specify("should return a promise for a promised resolution value", function(done) {
        var d = when.defer();

        d.resolve(when.resolve(sentinel))
        d.promise.then(
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            },
            fail
        );
    });

    specify("should return a promise for a promised rejection value", function(done) {
        var d = when.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.resolve(when.reject(sentinel))
        d.promise.then(
            fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            }
        );
    });

    specify("should invoke newly added callback when already resolved", function(done) {
        var d = when.defer();

        d.resolve(sentinel);

        d.promise.then(
            function(val) {
                assert.equal(val, sentinel);
                done();
            },
            fail
        );
    });



    specify("should reject with an immediate value", function(done) {
        var d = when.defer();

        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );

        d.reject(sentinel);
    });

    specify("should reject with fulfilled promised", function(done) {
        var d, expected;

        d = when.defer();
        expected = fakeResolved(sentinel);

        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, expected);
                done();
            }
        );

        d.reject(expected);
    });

    specify("should reject with rejected promise", function(done) {
        var d, expected;

        d = when.defer();
        expected = fakeRejected(sentinel);

        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, expected);
                done();
            }
        );

        d.reject(expected);
    });


    specify("should return a promise for the rejection value", function(done) {
        var d = when.defer();

        // Both the returned promise, and the deferred's own promise should
        // be rejected with the same value
        d.reject(sentinel);
        d.promise.then(
            fail,
            function(returnedPromiseVal) {
                assert.deepEqual(returnedPromiseVal, sentinel);
                done();
            }
        );
    });

    specify("should invoke newly added errback when already rejected", function(done) {
        var d = when.defer();

        d.reject(sentinel);

        d.promise.then(
            fail,
            function (val) {
                assert.deepEqual(val, sentinel);
                done();
            }
        );
    });



    specify("should notify of progress updates", function(done) {
        var d = when.defer();

        d.promise.then(
            fail,
            fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );

        d.notify(sentinel);
    });

    specify("should propagate progress to downstream promises", function(done) {
        var d = when.defer();

        d.promise
        .then(fail, fail,
            function(update) {
                return update;
            }
        )
        .then(fail, fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.notify(sentinel);
    });

    specify("should propagate transformed progress to downstream promises", function(done) {
        var d = when.defer();

        d.promise
        .then(fail, fail,
            function() {
                return sentinel;
            }
        )
        .then(fail, fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.notify(other);
    });

    specify("should propagate caught exception value as progress", function(done) {
        var d = when.defer();

        d.promise
        .then(fail, fail,
            function() {
                throw sentinel;
            }
        )
        .then(fail, fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.notify(other);
    });

    specify("should forward progress events when intermediary callback (tied to a resolved promise) returns a promise", function(done) {
        var d, d2;

        d = when.defer();
        d2 = when.defer();

        // resolve d BEFORE calling attaching progress handler
        d.resolve();

        d.promise.then(
            function() {
                var ret = pending();
                setTimeout(function(){
                    ret.notify(sentinel);
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
        var d = when.defer();

        d.promise.then(
            function() {
                var ret = pending();
                setTimeout(function(){
                    ret.notify(sentinel);
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

        d = when.defer();
        d2 = when.defer();

        d.promise
        .then(fail, fail,
            function() {
                return sentinel;
            }
        )
        .then(fail, fail,
            function(update) {
                assert.equal(update, sentinel);
                done();
            }
        );

        d.resolve(d2.promise);

        d2.notify();
    });

    specify("should allow resolve after progress", function(done) {
        var d = when.defer();

        var progressed = false;
        d.promise.then(
            function() {
                assert(progressed);
                done();
            },
            fail,
            function() {
                progressed = true;
            }
        );

        d.notify();
        d.resolve();
    });

    specify("should allow reject after progress", function(done) {
        var d = when.defer();

        var progressed = false;
        d.promise.then(
            fail,
            function() {
                assert(progressed);
                done();
            },
            function() {
                progressed = true;
            }
        );

        d.notify();
        d.reject();
    });

    specify("should be indistinguishable after resolution", function() {
        var d, before, after;

        d = when.defer();

        before = d.notify(sentinel);
        d.resolve();
        after = d.notify(sentinel);

        assert.equal(before, after);
    });

    //definitely not implemented
    /*
    specify("should return a promise for passed-in resolution value when already resolved", function(done) {
        var d = when.defer();
        d.resolve(other);

        d.resolve(sentinel);
        d.promise.then(function(val) {
            assert.equal(val, sentinel);
            done();
        });
    });


    specify("should return a promise for passed-in rejection value when already resolved", function(done) {
        var d = when.defer();
        d.resolve(other);

        d.reject(sentinel)
        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );
    });

    specify("should return a promise for passed-in resolution value when already rejected", function(done) {
        var d = when.defer();
        d.reject(other);

        d.resolve(sentinel)
        d.promise.then(function(val) {
            assert.equal(val, sentinel);
            done();
        });
    });

    specify("should return a promise for passed-in rejection value when already rejected", function(done) {
        var d = when.defer();
        d.reject(other);

        d.reject(sentinel)
        d.promise.then(
            fail,
            function(val) {
                assert.equal(val, sentinel);
                done();
            }
        );
    });
    */

    specify("should return silently on progress when already resolved", function() {
        var d = when.defer();
        d.resolve();

        refute.defined(d.notify());
    });

    specify("should return silently on progress when already rejected", function() {
        var d = when.defer();
        d.reject();
        d.promise.caught(function(){});
        refute.defined(d.notify());
    });
});
