/*Open Source Initiative OSI - The MIT License

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
(function(buster, define) {
var assert, fail, sentinel, other;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};
other = {};

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

function throwOnError(e) {
    var stack = e.error.stack;
    var message = "";
    if( stack ) {
        message = stack;
    }
    else {
        message = e.error.name + " in '" + e.name + "' " + e.error.message;
    }
    console.error(message);
    process.exit(-1);
}
buster.eventEmitter.on( "test:failure", throwOnError);
buster.eventEmitter.on( "test:timeout", throwOnError);



define('when.defer-test', function (require) {

    var when, delay, resolved, reject;
    when = require('../js/bluebird_debug.js');

    when.defer = when.pending;
    when.resolve = when.fulfilled;
    when.reject = when.rejected;
    var delay = function(val, ms) {
        var p = when.pending();
        setTimeout(function(){
            p.fulfill(val);
        }, ms);
        return p.promise
    };

    resolved = when.resolve;
    reject = when.reject;

    var a = when.fulfilled();
    a.constructor.prototype.ensure = a.constructor.prototype.lastly;

    buster.testCase('when.defer', {

        'resolve': {
            'should fulfill with an immediate value': function(done) {
                var d = when.defer();

                d.promise.then(
                    function(val) {
                        assert.same(val, sentinel);
                    },
                    fail
                ).ensure(done);

                d.resolve(sentinel);
            },

            'should fulfill with fulfilled promised': function(done) {
                var d = when.defer();

                d.promise.then(
                    function(val) {
                        assert.same(val, sentinel);
                    },
                    fail
                ).ensure(done);

                d.resolve(fakeResolved(sentinel));
            },

            'should reject with rejected promise': function(done) {
                var d = when.defer();

                d.promise.then(
                    fail,
                    function(val) {
                        assert.same(val, sentinel);
                    }
                ).ensure(done);

                d.resolve(fakeRejected(sentinel));
            },

            'should return a promise for the resolution value': function(done) {
                var d = when.defer();

                d.resolve(sentinel).then(
                    function(returnedPromiseVal) {
                        assert.equals(returnedPromiseVal, sentinel);
                    },
                    fail
                ).ensure(done);
            },

            'should return a promise for a promised resolution value': function(done) {
                var d = when.defer();

                d.resolve(when.resolve(sentinel)).then(
                    function(returnedPromiseVal) {
                        assert.equals(returnedPromiseVal, sentinel);
                    },
                    fail
                ).ensure(done);
            },

            'should return a promise for a promised rejection value': function(done) {
                var d = when.defer();

                // Both the returned promise, and the deferred's own promise should
                // be rejected with the same value
                d.resolve(when.reject(sentinel)).then(
                    fail,
                    function(returnedPromiseVal) {
                        assert.equals(returnedPromiseVal, sentinel);
                    }
                ).ensure(done);
            },

            'should invoke newly added callback when already resolved': function(done) {
                var d = when.defer();

                d.resolve(sentinel);

                d.promise.then(
                    function(val) {
                        assert.same(val, sentinel);
                        done();
                    },
                    fail
                ).ensure(done);
            }
        },

        'reject': {
            'should reject with an immediate value': function(done) {
                var d = when.defer();

                d.promise.then(
                    fail,
                    function(val) {
                        assert.same(val, sentinel);
                    }
                ).ensure(done);

                d.reject(sentinel);
            },

            'should reject with fulfilled promised': function(done) {
                var d, expected;

                d = when.defer();
                expected = fakeResolved(sentinel);

                d.promise.then(
                    fail,
                    function(val) {
                        assert.same(val, expected);
                    }
                ).ensure(done);

                d.reject(expected);
            },

            'should reject with rejected promise': function(done) {
                var d, expected;

                d = when.defer();
                expected = fakeRejected(sentinel);

                d.promise.then(
                    fail,
                    function(val) {
                        assert.same(val, expected);
                    }
                ).ensure(done);

                d.reject(expected);
            },


            'should return a promise for the rejection value': function(done) {
                var d = when.defer();

                // Both the returned promise, and the deferred's own promise should
                // be rejected with the same value
                d.reject(sentinel).then(
                    fail,
                    function(returnedPromiseVal) {
                        assert.equals(returnedPromiseVal, sentinel);
                    }
                ).ensure(done);
            },

            'should invoke newly added errback when already rejected': function(done) {
                var d = when.defer();

                d.reject(sentinel);

                d.promise.then(
                    fail,
                    function (val) {
                        assert.equals(val, sentinel);
                    }
                ).ensure(done);
            }
        },

        'notify': {

            'should notify of progress updates': function(done) {
                var d = when.defer();

                d.promise.then(
                    fail,
                    fail,
                    function(val) {
                        assert.same(val, sentinel);
                        done();
                    }
                );

                d.notify(sentinel);
            },

            'should propagate progress to downstream promises': function(done) {
                var d = when.defer();

                d.promise
                .then(fail, fail,
                    function(update) {
                        return update;
                    }
                )
                .then(fail, fail,
                    function(update) {
                        assert.same(update, sentinel);
                        done();
                    }
                );

                d.notify(sentinel);
            },

            'should propagate transformed progress to downstream promises': function(done) {
                var d = when.defer();

                d.promise
                .then(fail, fail,
                    function() {
                        return sentinel;
                    }
                )
                .then(fail, fail,
                    function(update) {
                        assert.same(update, sentinel);
                        done();
                    }
                );

                d.notify(other);
            },

            'should propagate caught exception value as progress': function(done) {
                var d = when.defer();

                d.promise
                .then(fail, fail,
                    function() {
                        throw sentinel;
                    }
                )
                .then(fail, fail,
                    function(update) {
                        assert.same(update, sentinel);
                        done();
                    }
                );

                d.notify(other);
            },

            'should forward progress events when intermediary callback (tied to a resolved promise) returns a promise': function(done) {
                var d, d2;

                d = when.defer();
                d2 = when.defer();

                // resolve d BEFORE calling attaching progress handler
                d.resolve();

                d.promise.then(
                    function() {
                        return when.promise(function(resolve, reject, notify) {
                            setTimeout(function() {
                                notify(sentinel);
                            }, 0);
                        });
                    }
                ).then(null, null,
                    function onProgress(update) {
                        assert.same(update, sentinel);
                        done();
                    }
                );
            },

            'should forward progress events when intermediary callback (tied to an unresovled promise) returns a promise': function(done) {
                var d = when.defer();

                d.promise.then(
                    function() {
                        return when.promise(function(resolve, reject, notify) {
                            setTimeout(function() {
                                notify(sentinel);
                            }, 0);
                        });
                    }
                ).then(null, null,
                    function onProgress(update) {
                        assert.same(update, sentinel);
                        done();
                    }
                );

                // resolve d AFTER calling attaching progress handler
                d.resolve();
            },

            'should forward progress when resolved with another promise': function(done) {
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
                        assert.same(update, sentinel);
                        done();
                    }
                );

                d.resolve(d2.promise);

                d2.notify();
            },

            'should allow resolve after progress': function(done) {
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
            },

            'should allow reject after progress': function(done) {
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
            },

            'should be indistinguishable after resolution': function() {
                var d, before, after;

                d = when.defer();

                before = d.notify(sentinel);
                d.resolve();
                after = d.notify(sentinel);

                assert.same(before, after);
            }
        },

        'should return a promise for passed-in resolution value when already resolved': function(done) {
            var d = when.defer();
            d.resolve(other);

            d.resolve(sentinel).then(function(val) {
                assert.same(val, sentinel);
            }).ensure(done);
        },

        'should return a promise for passed-in rejection value when already resolved': function(done) {
            var d = when.defer();
            d.resolve(other);

            d.reject(sentinel).then(
                fail,
                function(val) {
                    assert.same(val, sentinel);
                }
            ).ensure(done);
        },

        'should return silently on progress when already resolved': function() {
            var d = when.defer();
            d.resolve();

            refute.defined(d.notify());
        },

        'should return a promise for passed-in resolution value when already rejected': function(done) {
            var d = when.defer();
            d.reject(other);

            d.resolve(sentinel).then(function(val) {
                assert.same(val, sentinel);
            }).ensure(done);
        },

        'should return a promise for passed-in rejection value when already rejected': function(done) {
            var d = when.defer();
            d.reject(other);

            d.reject(sentinel).then(
                fail,
                function(val) {
                    assert.same(val, sentinel);
                }
            ).ensure(done);
        },

        'should return silently on progress when already rejected': function() {
            var d = when.defer();
            d.reject();

            refute.defined(d.notify());
        }

    });

});
}(
    this.buster || require('buster'),
    typeof define === 'function' && define.amd ? define : function( name, run ) {
        module.exports = run;
                run(require)
    }
));
