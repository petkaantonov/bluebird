"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var awaitLateQueue = testUtils.awaitLateQueue;

describe("Cancellation", function() {
    specify("requires a function", function() {
        return new Promise(function(_, __, onCancel) {
            onCancel();
        }).then(assert.fail, function(e) {
            assert(e instanceof Promise.TypeError);
        });
    });

    specify("can register multiple on same promise", function() {
        var cancelled = 0;
        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {cancelled++});
            onCancel(function() {cancelled++});
            onCancel(function() {cancelled++});
            onCancel(function() {cancelled++});
        });

        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("follower promises' handlers are not called, registered before", function() {
        var cancelled = 0;
        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {cancelled++});
        });

        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        });
        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        });
        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        });
        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(1, cancelled);
        });
    });

    specify("follower promises' handlers are not called, registered after", function() {
        var cancelled = 0;
        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {cancelled++});
        });

        p.cancel();
        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        new Promise(function(resolve, _, onCancel) {
            resolve(p);
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        return awaitLateQueue(function() {
            assert.equal(1, cancelled);
        });
    });

    specify("downstream follower promises' handlers are not called, registered before", function() {
        var cancelled = 0;
        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {cancelled++});
        });

        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        });
        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        });
        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        });

        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(1, cancelled);
        });
    });

    specify("downstream follower promises' handlers are called, registered after", function() {
        var cancelled = 0;
        var p = new Promise(function(_, __, onCancel) {
            onCancel(function() {cancelled++});
        });

        p.cancel();
        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        new Promise(function(resolve, _, onCancel) {
            resolve(p.then());
            onCancel(function() {cancelled++});
        }).suppressUnhandledRejections();
        return awaitLateQueue(function() {
            assert.equal(1, cancelled);
        });
    });

    specify("immediately rejected promise immediately cancelled with then in-between", function() {
        var error = new Error();
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var p = Promise.reject(error).then().lastly(resolve);
        p.cancel();
        p.caught(function() {});
        return result;
    });

    specify("callback is called asynchronously but fate is sealed synchronously", function() {
        var called = false;
        var promiseResolve;
        var promise = new Promise(function(resolve, reject, onCancel) {
            promiseResolve = resolve;
            onCancel(function() {
                called = true;
            });
        });
        return awaitLateQueue(function() {
            promise.cancel();
            promiseResolve();
            return Promise.resolve().then(function() {
                assert(called);
                assert(!promise.isFulfilled());
            });
        });
    });

    if (testUtils.isNodeJS) {
        specify("throws in process if callback throws", function() {
            var e = new Error();
            var promise = new Promise(function(resolve, reject, onCancel) {
                onCancel(function onCancel() {
                    throw e;
                });
            });
            promise.cancel();
            return testUtils.awaitGlobalException(function(err) {
                assert.equal(e, err);
            });
        });
    }

    specify("cancels the promise chain", function() {
        var called = false;
        var thens = 0;
        var resolveChain;
        var root = new Promise(function(resolve, reject, onCancel) {
            resolveChain = resolve;
            onCancel(function() {
                called = true;
            });
        }).then(function() {
            thens++;
        }).then(function() {
            thens++;
        }).then(function() {
            thens++;
        });

        root.cancel();
        resolveChain();
        return awaitLateQueue(function() {
            assert.equal(0, thens);
            assert(called);
        });
    });

    specify("calls finally handlers", function() {
        var called = false;
        var thens = 0;
        var resolveChain;
        var root = new Promise(function(resolve, reject, onCancel) {
            resolveChain = resolve;
            onCancel(function() {
                called = true;
            });
        });
        var chain = root.lastly(function() {
            thens++;
        }).lastly(function() {
            thens++;
        }).lastly(function() {
            thens++;
        });

        chain.cancel();
        resolveChain();
        return awaitLateQueue(function() {
            assert.equal(3, thens);
            assert(called);
        });
    });

    specify("cancels the followee", function() {
        var called = false;
        var finalled = false;
        var promise = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                called = true;
            });
        });
        var promise2 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise);
        });
        var promise3 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise2);
        }).lastly(function() {
            finalled = true;
        });

        promise3.cancel();
        return awaitLateQueue(function() {
            assert(called);
            assert(finalled);
        });
    });

    specify("cancels the followee, calling all callbacks and finally handlers", function() {
        var called = 0;
        var finalled = 0;

        var promise = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                called++;
            });
        }).lastly(function() {
            finalled++;
        });

        var promise2 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise);
            onCancel(function() {
                called++;
            });
        }).lastly(function() {
            finalled++;
        });

        var promise3 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise2);
            onCancel(function() {
                called++;
            });
        }).lastly(function() {
            finalled++;
        });

        promise3.cancel();
        return awaitLateQueue(function() {
            assert.equal(3, called);
            assert.equal(3, finalled);
        });
    });

    specify("cancels the followee, calling all onCancel callbacks", function() {
        var called = 0;

        var promise = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                called++;
            });
        })

        var promise2 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise);
            onCancel(function() {
                called++;
            });
        });

        var promise3 = new Promise(function(resolve, reject, onCancel) {
            resolve(promise2);
            onCancel(function() {
                called++;
            });
        });

        promise3.cancel();
        return awaitLateQueue(function() {
            assert.equal(3, called);
        });
    });

    specify("can be used for breaking chains early", function() {
        var called = false;
        var p = Promise.resolve(1)
            .then(function(data) {
                p["break"]();
            })
            .then(function() {
                called = true;
            });
        return awaitLateQueue(function() {
            assert(!called);
        });
    });

    specify("multiple cancel calls have no effect", function() {
        var called = 0;
        var finalled = 0;
        var req1 = new Promise(function(resolve, _, onCancel) {
            resolve();
            onCancel(function() {
                called++;
            });
        });

        var ret = req1.then(function() {
            return new Promise(function(_, __, onCancel) {
                onCancel(function() {
                    called++;
                });
            });
        }).then(function() {
            return new Promise(function(_, __, onCancel) {
                onCancel(function() {
                    called++;
                });
            });
        }).lastly(function() {
            finalled++;
        });

        req1.then(function() {
            ret.cancel();
            ret.cancel();
            ret.cancel();
        });

        return awaitLateQueue(function() {
            assert.equal(1, called);
            assert.equal(1, finalled);
        });
    });

    specify("throwing in finally turns into a rejection", function() {
        var e = new Error("");
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                throw e;
            })
            .caught(function(err) {
                assert.equal(err, e);
            });
        promise.cancel();
        return promise;
    });

    specify("returning an immediately rejected promise in finally turns into a rejection", function() {
        var e = new Error("");
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                return Promise.reject(e);
            })
            .caught(function(err) {
                assert.equal(err, e);
            });
        promise.cancel();
        return promise;
    });
    specify("returning an eventually rejected promise in finally turns into a rejection", function() {
        var e = new Error("");
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                return new Promise(function(resolve, reject, onCancel) {
                    Promise.delay(1).then(function() {
                        reject(e);
                    });
                });
            })
            .caught(function(err) {
                assert.equal(err, e);
            });
        promise.cancel();
        return promise;
    });

    specify("finally handler returned promises are awaited for", function() {
        var awaited = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                return Promise.delay(1).then(function() {
                    awaited++;
                });
            })
            .lastly(function() {
                return Promise.delay(1).then(function() {
                    awaited++;
                });
            })
            .lastly(function() {
                return Promise.delay(1).then(function() {
                    awaited++;
                });
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        return result.then(function() {
            assert.equal(3, awaited);
        });
    });

    specify("finally handler returned promises are skipped if they are cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                resolve();
            })
        promise.suppressUnhandledRejections();
        promise.cancel();
        return result.then(function() {
            assert.equal(3, cancelled);
        });
    });

    specify("finally handler returned promises are skipped if they are eventually cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        return result.then(function() {
            assert.equal(3, cancelled);
        });
    });

    specify("finally handler returned promises are skipped if theiy are eventually cancelled while following", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        return result.then(function() {
            assert.equal(6, cancelled);
        });
    });

    specify("finally handler returned promises are skipped if theiy are immediately cancelled while following", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                resolve();
            });
        promise.suppressUnhandledRejections();
        promise.cancel();
        return result.then(function() {
            assert.equal(6, cancelled);
        });
    });

    specify("finally handler returned promises target are skipped if their follower is eventually cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return p;
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(6, cancelled);
            });
        });
    });

    specify("finally handler returned promises target are skipped if their follower is immediately cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var promise = new Promise(function(_, __, onCancel) {})
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); });
                var ret = new Promise(function(resolve, _, onCancel) {
                    resolve(p);
                    onCancel(function() {
                        cancelled++;
                    });
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        promise.suppressUnhandledRejections();
        return result.then(function() {
            assert.equal(6, cancelled);
        });
    });

    specify("attaching handler on already cancelled promise", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        return awaitLateQueue(function() {
            p.lastly(resolve);
            return result;
        });
    });

    specify("if onCancel callback causes synchronous rejection, it is ignored and cancellation wins", function() {
        var promisifiedXhr = function() {
            var xhrReject;
            var xhr = {
                then: function(resolve, reject) {
                    xhrReject = reject;
                },
                abort: function() {
                    xhrReject(new Error(""));
                }
            };
            return new Promise(function(resolve, _, onCancel) {
                resolve(xhr);
                onCancel(function() {
                    xhr.abort();
                });
            });
        };

        var req = promisifiedXhr().lastly(function() {
            resolve();
        });
        req.cancel();
        var resolve;
        return new Promise(function(_, __, onCancel) {resolve = arguments[0]});
    });

    specify("isCancelled() synchronously returns true after calling cancel() on pending promise", function() {
        var promise = new Promise(function () {});
        promise.cancel();
        assert(promise.isCancelled());
    });

    specify("isCancelled() synchronously returns true after calling cancel() on promise created from .then()", function() {
        var promise = new Promise(function () {});
        var thenPromise = promise.then();
        thenPromise.cancel();
        assert(thenPromise.isCancelled());
    });

    specify("gh-166", function() {
        var f1 = false, f2 = false, f3 = false, f4 = false;
        var a = Promise.resolve();
        a = a.then(function() {
            f1 = true;
            return Promise.delay(1);
        });

        a = a.then(function() {
            f2 = true;
            return Promise.delay(1);
        });

        a = a.then(function() {
            f3 = true;
            return Promise.delay(1);
        }).then(function() {
            assert(a.isCancellable());
            a.cancel();
        }).delay(100);


        a = a.then(function() {
            f4 = true;
        });

        var waitingForLongDelay = a;

        a = a.lastly(function() {
            assert(f1); assert(f2); assert(f3);
            assert(!f4);
            assert(waitingForLongDelay.isCancelled());
            resolve();
        });

        assert(a.isCancellable());
        var resolve;
        var p = new Promise(function(_, __, onCancel) {resolve = arguments[0]});
        return p;
    });

    specify("gh-1187", function() {
        var a = Promise.delay(300).lastly(function() {});
        a.cancel();
        assert(a.isCancelled());
        assert(!a.isCancellable());
    })
});

describe("Cancellation with .all", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.all(p).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.all(p).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.all([1,2,p]).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.all([1,2,p]).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.all(inputs)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.all(inputs)
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.all(input)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.all(input).lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });
});

describe("Cancellation with .props", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.props(p).lastly(resolve).suppressUnhandledRejections();
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.props(p).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.props([1,2,p]).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.props([1,2,p]).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.props(inputs).lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.props(inputs).lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.props(input).lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.props(input)
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });
});

describe("Cancellation with .some", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.some(p, 1).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.some(p, 1).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.some(inputs, 1)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.some(inputs, 1)
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });


    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.some(input, 1)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.some(input, 1)
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("some promises are cancelled immediately", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        p1.cancel();
        p2.cancel();
        resolve(1);
        return Promise.some([p1, p2, p3], 1).then(function(result) {
            assert.deepEqual([1], result);
        });
    });

    specify("some promises are cancelled eventually", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        Promise.delay(1).then(function() {
            p1.cancel();
            p2.cancel();
            return Promise.delay(1).then(function() {
                resolve(1);
            });
        });
        return Promise.some([p1, p2, p3], 1).then(function(result) {
            assert.deepEqual([1], result);
        });
    });

    specify("promise for some promises that are cancelled immediately", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        p1.cancel();
        p2.cancel();
        resolve(1);
        var promise = Promise.delay(1, [p1, p2, p3]);
        return Promise.some(promise, 1).then(function(result) {
            assert.deepEqual([1], result);
        });
    });

    specify("promise for some promises that are cancelled eventually", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        Promise.delay(1).then(function() {
            p1.cancel();
            p2.cancel();
            return Promise.delay(1).then(function() {
                resolve(1);
            });
        });
        var promise = Promise.delay(1, [p1, p2, p3]);
        return Promise.some(promise, 1).then(function(result) {
            assert.deepEqual([1], result);
        });
    });


    specify("all promises cancel, not enough for fulfillment - immediately", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {});
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        p1.cancel();
        p2.cancel();
        p3.cancel();
        Promise.some([p1, p2, p3], 1).then(assert.fail, function(e) {
            assert(e instanceof Promise.CancellationError);
            resolve();
        });
        return result;
    });

    specify("all promises cancel, not enough for fulfillment - eventually", function() {
        var resolve;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {});
        var result = new Promise(function(_, __, onCancel) {resolve = arguments[0];});

        Promise.delay(1).then(function() {
            p1.cancel();
            p2.cancel();
            return Promise.delay(1).then(function() {
                p3.cancel();
            });
        });
        Promise.some([p1, p2, p3], 1).then(assert.fail, assert.fail).lastly(resolve);
        return result;
    });

    specify("some promises cancel, some reject, not enough for fulfillment - immediately", function() {
        var error = new Error();
        var reject;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {reject = arguments[1];});

        p1.cancel();
        p2.cancel();
        reject(error);
        return Promise.some([p1, p2, p3], 1).then(assert.fail, function(result) {
            assert(result instanceof Promise.AggregateError);
            assert.equal(1, result.length);
            assert.equal(error, result[0]);
        });
    });

    specify("some promises cancel, some reject, not enough for fulfillment - eventually", function() {
        var error = new Error();
        var reject;
        var p1 = new Promise(function(_, __, onCancel) {});
        var p2 = new Promise(function(_, __, onCancel) {});
        var p3 = new Promise(function(_, __, onCancel) {reject = arguments[1];});

        Promise.delay(1).then(function() {
            p1.cancel();
            p2.cancel();
            return Promise.delay(1).then(function() {
                reject(error);
            });
        });
        return Promise.some([p1, p2, p3], 1).then(assert.fail, function(result) {
            assert(result instanceof Promise.AggregateError);
            assert.equal(1, result.length);
            assert.equal(error, result[0]);
        });
    });
});

describe("Cancellation with .reduce", function() {
    specify("initialValue immediately cancelled immediate input", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        initialValue.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("initialValue eventually cancelled immediate input", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            initialValue.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("initialValue eventually cancelled eventual input", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) {});
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            initialValue.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("initialValue immediately cancelled eventual input", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) {});
        initialValue.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("returned promise cancels immediately", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(a, b) {
            finalled++;
            var ret = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
            ret.cancel();
            return ret;
        }).lastly(function() {
            finalled++;
        });

        return awaitLateQueue(function() {
            assert.equal(3, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("returned promise cancels eventually", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(a, b) {
            finalled++;
            var ret = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
            awaitLateQueue(function() {
                ret.cancel();
            });
            return ret;
        }).lastly(function() {
            finalled++;
        });

        return awaitLateQueue(function() {
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(3, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("input immediately cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) {});
        inputs.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(0, cancelled);
        });
    });

    specify("input eventually cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) {});
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            inputs.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(0, cancelled);
                });
            });
        });
    });

    specify("output immediately cancelled while waiting inputs", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
            .lastly(function() {finalled++});

        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(3, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("output immediately cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(5, finalled);
            assert.equal(4, cancelled);
        });
    });

    specify("output immediately cancelled while waiting firstValue", function() {
        var initialValue = 1;
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(3, cancelled);
        });
    });

    specify("output immediately cancelled while waiting firstValue and secondValue", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(3, cancelled);
        });
    });

    specify("output immediately cancelled while waiting for a result", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(a, b) {
            finalled++;
            return new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
        }).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("output eventually cancelled while waiting inputs", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
            .lastly(function() {finalled++});

        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(3, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(5, finalled);
                    assert.equal(4, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting firstValue", function() {
        var initialValue = 1;
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(3, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting firstValue and secondValue", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(3, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting for a result", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(a, b) {
            finalled++;
            return new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
        }).lastly(function() {
            finalled++;
        });

        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });
});

describe("Cancellation with .map", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.map(p, function(){}).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.map(p, function(){}).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.map([1,2,p], function(){}).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(_, __, onCancel) {});
        Promise.map([1,2,p], function(){}).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.map(inputs, function(){})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.map(inputs, function(){})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.map(input, function(){})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(_, __, onCancel) { onCancel(function(){ cancelled++; }); }).lastly(function() {
            finalled++;
        });

        var all = Promise.map(input, function(){})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("result cancelled immediately while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        var all = Promise.map([1, 2, 3], function(value, index) {
            return new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        }).lastly(function() {
            finalled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(3, cancelled);
        });
    });

    specify("result cancelled eventually while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        var all = Promise.map([1, 2, 3], function(value, index) {
            return new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        }).lastly(function() {
            finalled++;
        });

        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(3, cancelled);
                });
            });
        });
    });

    specify("returned promise cancelled immediately while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        Promise.map([1, 2, 3], function(value, index) {
            var ret = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
            if (index === 2) {
                ret.cancel();
            }
            return ret;
        }).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("returned promise  cancelled eventually while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        Promise.map([1, 2, 3], function(value, index) {
            var ret = new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++});
            if (index === 2) {
                awaitLateQueue(function() {
                    ret.cancel();
                });
            }
            return ret;
        }).lastly(function() {
            finalled++;
        });

        return awaitLateQueue(function() {
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });
});
describe("Cancellation with .bind", function() {
    specify("immediately cancelled promise passed as ctx", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(_, __, onCancel) {});
        ctx.cancel();
        Promise.bind(ctx).lastly(function() {
            finalled++;
        }).suppressUnhandledRejections();
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(0, cancelled);
        });
    });

    specify("eventually cancelled promise passed as ctx", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(_, __, onCancel) {});
        Promise.bind(ctx).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            ctx.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(0, cancelled);
                });
            });
        });
    });

    specify("main promise is immediately cancelled while waiting on binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var resolve;
        var ctx = new Promise(function(_, __, onCancel) {resolve = arguments[0];});
        var main = new Promise(function(_, __, onCancel) {});
        main.cancel();
        main.bind(ctx).lastly(function() {
            finalled++;
        }).suppressUnhandledRejections();
        return awaitLateQueue(function() {
            resolve();
            return ctx;
        }).then(function() {
            return awaitLateQueue(function() {
                assert.equal(1, finalled);
                assert.equal(0, cancelled);
            });
        });
    });

    specify("main promise is eventually cancelled while waiting on binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(_, __, onCancel) {});
        var main = new Promise(function(_, __, onCancel) {});

        main.bind(ctx).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            main.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(0, cancelled);
                });
            });
        });
    });

    specify("main promise is immediately cancelled with immediate binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(_, __, onCancel) {});
        main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        });
        main.cancel();
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(0, cancelled);
        });
    });

    specify("main promise is eventually cancelled with immediate binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(_, __, onCancel) {});
        main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        });
        return awaitLateQueue(function() {
            main.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(0, cancelled);
                });
            });
        });
    });

    specify("result is immediately cancelled while waiting for binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });
        var result = Promise.bind(ctx).lastly(function() {
            finalled++;
        });
        result.cancel();
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("result is eventually cancelled while waiting for binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });

        var result = Promise.bind(ctx).lastly(function() {
            finalled++;
        });
        return awaitLateQueue(function() {
            result.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("result is immediately cancelled while waiting for main promise", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });

        var result = main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        });
        result.cancel();
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("result is eventually cancelled while waiting for main promise", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(_, __, onCancel) {
            onCancel(function() {
                cancelled++;
            });
        }).lastly(function() {
            finalled++;
        });

        var result = main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        });
        return awaitLateQueue(function() {
            result.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });
});

describe("Cancellation with .join", function() {
    specify("immediately cancelled input inside array", function() {
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();
        Promise.join(1,2,p, assert.fail).then(reject, function(e) {
            assert(e instanceof Promise.CancellationError);
            resolve();
        });
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(_, __, onCancel) {});
        Promise.join(1,2,p, assert.fail).then(reject, reject).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.join(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++}),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
        ];

        var all = Promise.join(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
            });
        });
    });
});

describe("Cancellation with .reflect", function() {
    specify("immediately cancelled", function() {
        var promise = new Promise(function(_, __, onCancel) {});
        promise.cancel();
        return promise.reflect().then(function(value) {
            assert(!value.isFulfilled());
            assert(!value.isRejected());
            assert(!value.isPending());
            assert(value.isCancelled());
        });
    });

    specify("eventually cancelled", function() {
        var promise = new Promise(function(_, __, onCancel) {});

        var ret = promise.reflect().then(function(value) {
            assert(!value.isFulfilled());
            assert(!value.isRejected());
            assert(!value.isPending());
            assert(value.isCancelled());
        });

        Promise.delay(1).then(function() {
            promise.cancel();
        });
        return ret;
    });
});

describe("Cancellation with .using", function() {
    specify("immediately cancelled input", function() {
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(_, __, onCancel) {});
        p.cancel();

        var disposerCalled = false;
        var disposable = new Promise(function(_, __, onCancel) {
            setTimeout(arguments[0], 1);
        }).disposer(function() {
            disposerCalled = true;
        });

        Promise.using(1, disposable, p, assert.fail).then(reject, function(e) {
            assert(e instanceof Promise.CancellationError);
            assert(disposerCalled);
            resolve();
        });

        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(_, __, onCancel) {});

        var disposerCalled = false;
        var disposable = new Promise(function(_, __, onCancel) {
            setTimeout(arguments[0], 1);
        }).disposer(function() {
            disposerCalled = true;
        });

        Promise.using(1, disposable, p, assert.fail).then(reject, reject).lastly(function() {
            assert(disposerCalled);
            resolve();
        });

        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("eventually cancelled input with 1 fulfilled disposer", function() {
        var resolve, reject;
        var fulfillResource;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(_, __, onCancel) {});

        var disposerCalled = false;
        var disposable = new Promise(function(_, __, onCancel) {fulfillResource = arguments[0];}).disposer(function() {
            disposerCalled = true;
        });

        Promise.using(1,disposable,p, assert.fail).then(reject, reject).lastly(function() {
            assert(disposerCalled);
            resolve();
        });

        return awaitLateQueue(function() {
            fulfillResource({});
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var disposerCalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
                assert.equal(disposerCalled, 0);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var disposerCalled = 0;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 3);
                assert.equal(finalled, 4);
                assert.equal(disposerCalled, 0);
            });
        });
    });

    specify("eventually cancelled output with 1 disposer fulfilled", function() {
        var cancelled = 0;
        var finalled = 0;
        var disposerCalled = 0;
        var fulfillResource;
        var inputs = [
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) {fulfillResource = arguments[0];})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(_, __, onCancel) { onCancel(function() { cancelled++; }); })
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        Promise.delay(1).then(function() {
            fulfillResource({})
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 3);
                assert.equal(disposerCalled, 1);
            });
        });
    });

    specify("result immediately cancelled when inside handler", function() {
        var disposerCalled = 0;
        var cancelled = 0;
        var finalled = 0;
        var resource1 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var resource2 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var all = Promise.using(resource1, resource2, function(res1, res2) {
            var ret = new Promise(function(_, __, onCancel) {});
            all.cancel();
            return ret;
        }).then(reject, reject)
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 0);
                assert.equal(finalled, 1);
                assert.equal(disposerCalled, 2);
            });
        });
    });

    specify("result eventually cancelled when inside handler", function() {
        var disposerCalled = 0;
        var cancelled = 0;
        var finalled = 0;
        var resource1 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var resource2 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var all = Promise.using(resource1, resource2, function(res1, res2) {
            var ret = new Promise(function(_, __, onCancel) {});
            Promise.delay(1).then(function() {
                all.cancel();
            });
            return ret;
        }).then(reject, reject)
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 0);
                assert.equal(finalled, 1);
                assert.equal(disposerCalled, 2);
            });
        });
    });

    specify("promise returned from handler immediately cancelled", function() {
        var disposerCalled = 0;
        var cancelled = 0;
        var finalled = 0;
        var resource1 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var resource2 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        var all = Promise.using(resource1, resource2, function(res1, res2) {
            var ret = new Promise(function(_, __, onCancel) {});
            ret.cancel();
            return ret;
        }).then(reject, function(e) {
            if(!(e instanceof Promise.CancellationError)) reject(new Error());
        }).lastly(function() {finalled++; resolve(); });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 0);
                assert.equal(finalled, 1);
                assert.equal(disposerCalled, 2);
            });
        });
    });

    specify("promise returned from handler eventually cancelled", function() {
        var disposerCalled = 0;
        var cancelled = 0;
        var finalled = 0;
        var resource1 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var resource2 = Promise.resolve().disposer(function() {
            disposerCalled++;
        });

        var all = Promise.using(resource1, resource2, function(res1, res2) {
            var ret = new Promise(function(_, __, onCancel) {});
            Promise.delay(1).then(function() {
                ret.cancel();
            });
            return ret;
        }).then(reject, reject)
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 0);
                assert.equal(finalled, 1);
                assert.equal(disposerCalled, 2);
            });
        });
    });
});

describe("Multi-branch cancellation", function() {
    specify("3 branches, 1 cancels", function() {
        var successCalls = 0;
        var rootGotCancelled = false;
        var resolveRoot;
        var root = new Promise(function(resolve, __, onCancel) {
            onCancel(function() {
                rootGotCancelled = true;
            });
            resolveRoot = resolve;
        });

        var a = root.then(function() {
            successCalls++;
        });
        var b = root.then(function() {
            successCalls++;
        });
        var c = root.then(function() {
            successCalls++;
        });

        return awaitLateQueue(function() {
            b.cancel();
        }).then(function() {
            return awaitLateQueue(resolveRoot);
        }).then(function() {
            return awaitLateQueue(function() {
                assert(!rootGotCancelled);
                assert.equal(2, successCalls);
            });
        });
    });

    specify("3 branches, 3 cancels", function() {
        var successCalls = 0;
        var rootGotCancelled = false;
        var resolveRoot;
        var root = new Promise(function(resolve, __, onCancel) {
            onCancel(function() {
                rootGotCancelled = true;
            });
            resolveRoot = resolve;
        });

        var a = root.then(function() {
            successCalls++;
        });
        var b = root.then(function() {
            successCalls++;
        });
        var c = root.then(function() {
            successCalls++;
        });

        return awaitLateQueue(function() {
            a.cancel();
            b.cancel();
            c.cancel();
        }).then(function() {
            return awaitLateQueue(resolveRoot);
        }).then(function() {
            return awaitLateQueue(function() {
                assert(rootGotCancelled);
                assert.equal(0, successCalls);
            });
        });
    });

    specify("3 branches, root cancels", function() {
        var successCalls = 0;
        var rootGotCancelled = false;
        var resolveRoot;
        var root = new Promise(function(resolve, __, onCancel) {
            onCancel(function() {
                rootGotCancelled = true;
            });
            resolveRoot = resolve;
        });

        var a = root.then(function() {
            successCalls++;
        });
        var b = root.then(function() {
            successCalls++;
        });
        var c = root.then(function() {
            successCalls++;
        });

        return awaitLateQueue(function() {
            root.cancel();
        }).then(function() {
            return awaitLateQueue(resolveRoot);
        }).then(function() {
            return awaitLateQueue(function() {
                assert(rootGotCancelled);
                assert.equal(0, successCalls);
            });
        });
    });

    specify("3 branches, each have 3 branches, all children of b cancel", function() {
        var successCalls = 0;
        var rootGotCancelled = false;
        var resolveRoot;
        var root = new Promise(function(resolve, __, onCancel) {
            onCancel(function() {
                rootGotCancelled = true;
            });
            resolveRoot = resolve;
        });

        var a = root.then(function() {
            successCalls++;
        });

        var a1 = a.then(function() {
            successCalls++;
        });

        var a2 = a.then(function() {
            successCalls++;
        });

        var a3 = a.then(function() {
            successCalls++;
        });

        var b = root.then(function() {
            successCalls++;
        });

        var b1 = b.then(function() {
            successCalls++;
        });

        var b2 = b.then(function() {
            successCalls++;
        });

        var b3 = b.then(function() {
            successCalls++;
        });

        var c = root.then(function() {
            successCalls++;
        });

        var c1 = c.then(function() {
            successCalls++;
        });

        var c2 = c.then(function() {
            successCalls++;
        });

        var c3 = c.then(function() {
            successCalls++;
        });

        return awaitLateQueue(function() {
            b1.cancel();
            b2.cancel();
            b3.cancel();
        }).then(function() {
            return awaitLateQueue(resolveRoot);
        }).then(function() {
            return awaitLateQueue(function() {
                assert(!rootGotCancelled);
                assert.equal(8, successCalls);
                assert(b.isCancelled());
                assert(b1.isCancelled());
                assert(b2.isCancelled());
                assert(b3.isCancelled());
            });
        });
    });

    specify("3 branches, each have 3 branches, all grand children cancel", function() {
        var successCalls = 0;
        var rootGotCancelled = false;
        var resolveRoot;
        var root = new Promise(function(resolve, __, onCancel) {
            onCancel(function() {
                rootGotCancelled = true;
            });
            resolveRoot = resolve;
        });

        var a = root.then(function() {
            successCalls++;
        });

        var a1 = a.then(function() {
            successCalls++;
        });

        var a2 = a.then(function() {
            successCalls++;
        });

        var a3 = a.then(function() {
            successCalls++;
        });

        var b = root.then(function() {
            successCalls++;
        });

        var b1 = b.then(function() {
            successCalls++;
        });

        var b2 = b.then(function() {
            successCalls++;
        });

        var b3 = b.then(function() {
            successCalls++;
        });

        var c = root.then(function() {
            successCalls++;
        });

        var c1 = c.then(function() {
            successCalls++;
        });

        var c2 = c.then(function() {
            successCalls++;
        });

        var c3 = c.then(function() {
            successCalls++;
        });

        return awaitLateQueue(function() {
            a1.cancel();
            a2.cancel();
            a3.cancel();
            b1.cancel();
            b2.cancel();
            b3.cancel();
            c1.cancel();
            c2.cancel();
            c3.cancel();
        }).then(function() {
            return awaitLateQueue(resolveRoot);
        }).then(function() {
            return awaitLateQueue(function() {
                assert(rootGotCancelled);
                assert.equal(0, successCalls);
                assert(a.isCancelled());
                assert(a1.isCancelled());
                assert(a2.isCancelled());
                assert(a3.isCancelled());
                assert(b.isCancelled());
                assert(b1.isCancelled());
                assert(b2.isCancelled());
                assert(b3.isCancelled());
                assert(c.isCancelled());
                assert(c1.isCancelled());
                assert(c2.isCancelled());
                assert(c3.isCancelled());
            });
        });
    });
});



if (testUtils.isNodeJS) {
    describe("issues", function() {
        specify("cancels the promise chain within a domain GH963", function() {
            var called = 0;
            var thens = 0;
            var resolveChain;
            var Domain = require("domain");
            var domain = Domain.create();

            domain.enter();

            var root = new Promise(function(resolve, reject, onCancel) {
                resolveChain = resolve;
                onCancel(function() {
                    called++;
                });
            }).then(function() {
                thens++;
            }).then(function() {
                thens++;
            }).then(function() {
                thens++;
            }).lastly(function() {
                called++;
            });

            root.cancel();
            resolveChain();
            return awaitLateQueue(function() {
                assert.equal(0, thens);
                assert.equal(2, called);
                domain.exit();
            });
        });
    });

    describe("GH926", function() {
        var clear, set;
        var clears = 0;
        before(function() {
            clears = 0;
            set = setTimeout;
            clear = clearTimeout;
            setTimeout = function() {
                return set.apply(this, arguments);
            };
            clearTimeout = function() {
                clears++;
                return clear.apply(this, arguments);
            };
        });

        after(function() {
            clears = 0;
            setTimeout = set;
            clearTimeout = clear;
        });

        specify("GH926", function() {
            var calls = 0;
            var p = new Promise(function(resolve, reject, onCancel) {
                onCancel(function() { calls++; });
              })
              .timeout(10000000)
              .lastly(function() {
                calls++;
              });

            p.cancel();

            return awaitLateQueue(function() {
                assert.equal(2, calls);
                assert.equal(1, clears);
            });
        });
    });

    describe("GH1000", function() {
        var clear, set;
        var clears = 0, sets = 0;
        beforeEach(function() {
            clears = 0;
            sets = 0;
            set = setTimeout;
            clear = clearTimeout;
            setTimeout = function() {
                sets++;
                return set.apply(this, arguments);
            };
            clearTimeout = function() {
                clears++;
                return clear.apply(this, arguments);
            };
        });

        afterEach(function() {
            clears = 0;
            sets   = 0;
            setTimeout = set;
            clearTimeout = clear;
        });

        specify("delay", function() {
            var calls = 0,
                never = 0;
            var p = Promise
              .delay(10000000)
              .then(function () {
                never++;
              });

            p.lastly(function() {
                if (p.isCancelled()) {
                    calls++;
                }
            });

            p.cancel();

            return awaitLateQueue(function() {
                assert.equal(0, never);
                assert.equal(1, calls);
                assert.equal(1, clears);
            });
        });

        specify("delay with value", function() {
            var calls = 0,
                never = 0;

            var p = Promise
              .delay(10000000, true)
              .then(function () {
                never++;
              });

            p.lastly(function() {
                if (p.isCancelled()) {
                    calls++;
                }
            });



            return Promise.delay(10)
                .then(function () {
                    p.cancel();
                    return awaitLateQueue(function() {
                            assert.equal(0, never);
                            assert.equal(1, calls);
                            assert.equal(1, clears);
                        });
                });
        });

        specify("cancel delay cancels inner promise", function() {
            var calls = 0,
                never = 0;
            var pInner = Promise.delay(1000)
                    .then(function () {
                        never++;
                    });

            pInner.lastly(function() {
                if (pInner.isCancelled()) {
                    calls++;
                }
            });

            var pOuter = Promise
              .delay(10000000, pInner)
              .then(function () {
                never++;
              });

            pOuter.lastly(function() {
                if (pOuter.isCancelled()) {
                    calls++;
                }
            });



            pOuter.cancel();
            return awaitLateQueue(function() {
                assert.equal(0, never);
                assert.equal(2, calls);
            });
        });

        specify("cancel inner promise cancels delay", function() {
            var calls = 0,
                never = 0;
            var pInner = Promise.delay(1000)
                    .then(function () {
                        never++;
                    });

            pInner.lastly(function() {
                if (pInner.isCancelled()) {
                    calls++;
                }
            });

            var pOuter = Promise
              .delay(10000000, pInner)
              .then(function () {
                never++;
              });

            pOuter.lastly(function() {
                if (pOuter.isCancelled()) {
                    calls++;
                }
            });



            pInner.cancel();
            return awaitLateQueue(function() {
                assert.equal(0, never);
                assert.equal(2, calls);
            });
        });
    });
}
