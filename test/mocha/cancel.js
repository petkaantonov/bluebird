"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var awaitLateQueue = testUtils.awaitLateQueue;

describe("Cancellation", function() {
    specify("requires a function", function() {
        return Promise.resolve().onCancel().then(assert.fail, function(e) {
            assert(e instanceof Promise.TypeError);
        });
    });

    specify("can register multiple on same promise", function() {
        var cancelled = 0;
        var p = new Promise(function() {})
            .onCancel(function() {cancelled ++})
            .onCancel(function() {cancelled ++})
            .onCancel(function() {cancelled ++})
            .onCancel(function() {cancelled ++});
        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("shoud be consistent for mid-chain breaking", function () {
        var called = 0;

        function test(p) {
            var chain;
            return chain = p.then(function() {
                // `p` has been fulfilled already at this point
                chain.cancel();
            }).then(function(){
                called++;
            });
        }

        var immediate = Promise.resolve();
        var eventual = Promise.delay(0);

        test(immediate);
        test(eventual);

        return awaitLateQueue (function(){
            assert(called % 2 == 0);
            // either both should be called or both should not be called
        });
    });


    specify("handlers are called downstream, registered before", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        p.then().onCancel(function() {cancelled ++});
        p.then().onCancel(function() {cancelled ++});
        p.then().onCancel(function() {cancelled ++});
        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("handlers are called downstream, registered after", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        p.cancel();
        p.then().onCancel(function() {cancelled ++});
        p.then().onCancel(function() {cancelled ++});
        p.then().onCancel(function() {cancelled ++});
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("follower promises' handlers are called, registered before", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("follower promises' handlers are called, registered after", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        p.cancel();
        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p);}).onCancel(function() {cancelled ++});
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("downstream follower promises' handlers are called, registered before", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        p.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("downstream follower promises' handlers are called, registered after", function() {
        var cancelled = 0;
        var p = new Promise(function() {}).onCancel(function() {cancelled ++});

        p.cancel();
        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        new Promise(function(resolve) {resolve(p.then());}).onCancel(function() {cancelled ++});
        return awaitLateQueue(function() {
            assert.equal(4, cancelled);
        });
    });

    specify("immediately rejected promise immediately cancelled", function() {
        var error = new Error();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0];});
        var p = Promise.reject(error).lastly(resolve);
        p.cancel();
        p.caught(function() {});
        return result;
    });

    specify("immediately rejected promise immediately cancelled with then in-between", function() {
        var error = new Error();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0];});
        var p = Promise.reject(error).then().lastly(resolve);
        p.cancel();
        p.caught(function() {});
        return result;
    });

    specify("immediately rejected promise immediately cancelled with catch in-between that returns promise", function() {
        var awaited = 0;
        var error = new Error();
        var p = Promise.reject(error).then(assert.fail, function(e) {
            assert.equal(error, e);
            return Promise.delay(1).then(function() {
                awaited++;
            });
        }).then(function() {
            assert.equal(awaited, 1);
        });
        p.cancel();
        return p;
    });

    specify("callback is called asynchronously but fate is sealed synchronously", function() {
        var called = false;
        var promiseResolve;
        var promise = new Promise(function(resolve, reject) {
            promiseResolve = resolve;
        }).onCancel(function onCancel() {
            called = true;
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
            var promise = new Promise(function(resolve, reject) {}).onCancel(function onCancel() {
                throw e;
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
        var root = new Promise(function(resolve, reject) {
            resolveChain = resolve;
        }).onCancel(function() {
            called = true;
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
        var root = new Promise(function(resolve, reject) {
            resolveChain = resolve;
        });
        var chain = root.onCancel(function onCancel() {
            called = true;
        }).lastly(function() {
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

    specify("calls multiple cancellation callbacks ", function() {
        var called = 0;
        var thens = 0;
        var resolveChain;
        var root = new Promise(function(resolve, reject) {
            resolveChain = resolve;
        });
        var chain = root.onCancel(function onCancel() {
            called++;
        }).lastly(function() {
            thens++;
        }).onCancel(function onCancel() {
            called++;
        }).lastly(function() {
            thens++;
        }).onCancel(function onCancel() {
            called++;
        }).lastly(function() {
            thens++;
        });

        chain.cancel();
        resolveChain();
        return awaitLateQueue(function() {
            assert.equal(3, thens);
            assert.equal(3, called);
        });
    });

    specify("cancels the followee", function() {
        var called = false;
        var finalled = false;
        var promise = new Promise(function(){}).onCancel(function() {
            called = true;
        });
        var promise2 = new Promise(function(resolve, reject) {
            resolve(promise);
        });
        var promise3 = new Promise(function(resolve, reject) {
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

        var promise = new Promise(function(){}).onCancel(function() {
            called++;
        }).lastly(function() {
            finalled++;
        });

        var promise2 = new Promise(function(resolve, reject) {
            resolve(promise);
        }).onCancel(function() {
            called++;
        }).lastly(function() {
            finalled++;
        });

        var promise3 = new Promise(function(resolve, reject) {
            resolve(promise2);
        }).onCancel(function() {
            called++;
        }).lastly(function() {
            finalled++;
        });

        promise3.cancel();
        return awaitLateQueue(function() {
            assert.equal(3, called);
            assert.equal(3, finalled);
        });
    });

    specify("multiple cancel calls have no effect", function() {
        var called = 0;
        var finalled = 0;
        var req1 = Promise.resolve().onCancel(function() {
            called++;
        });

        var ret = req1.then(function() {
            return new Promise(function(){}).onCancel(function() {
                called++;
            });
        }).then(function() {
            return new Promise(function(){}).onCancel(function() {
                called++;
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
        var promise = new Promise(function() {})
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
        var promise = new Promise(function() {})
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
        var promise = new Promise(function() {})
            .lastly(function() {
                return new Promise(function(resolve, reject) {
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
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
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
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
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

    specify("finally handler returned promises are skipped if they are eventually cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var ret = new Promise(function() {}).onCancel(function() {
                    cancelled++;
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
            assert.equal(3, cancelled);
        });
    });

    specify("finally handler returned promises are skipped if theiy are eventually cancelled while following", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
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
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return ret;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
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

    specify("finally handler returned promises target are skipped if their follower is eventually cancelled", function() {
        var cancelled = 0;
        var resolve;
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                Promise.delay(1).then(function() {
                    ret.cancel();
                });
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
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
        var result = new Promise(function() {resolve = arguments[0];});
        var promise = new Promise(function() {})
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                var p = new Promise(function(){}).onCancel(function() {
                    cancelled++;
                });
                var ret = new Promise(function(resolve) {
                    resolve(p);
                }).onCancel(function() {
                    cancelled++;
                });
                ret.cancel();
                return p;
            })
            .lastly(function() {
                resolve();
            })
        promise.cancel();
        return result.then(function() {
            assert.equal(6, cancelled);
        });
    });

    specify("attaching handler on already cancelled promise", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        return awaitLateQueue(function() {
            p.lastly(resolve);
            return result;
        });
    });

    specify("if onCancel callback causes synchronous rejection, it is ignored and cancellation wins", function() {
        var cancelled = 0;
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
            return Promise.resolve(xhr).onCancel(function() {
                xhr.abort();
            });
        };

        var req = promisifiedXhr().onCancel(function() {
            assert.equal(1, cancelled);
            resolve();
        }).lastly(function() {
            cancelled++;
        });
        req.cancel();
        var resolve;
        return new Promise(function() {resolve = arguments[0]});
    })
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
        var p = new Promise(function(){resolve = arguments[0]});
        return p;
    });
});

describe("Cancellation with .all", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.all(p).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        Promise.all(p).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.all([1,2,p]).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.all(inputs)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.all(inputs)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.all(input)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.all(input)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });
});

describe("Cancellation with .props", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.props(p).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        Promise.props(p).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.props([1,2,p]).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.props(inputs)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.props(inputs)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.props(input)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.props(input)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });
});

describe("Cancellation with .some", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.some(p, 1).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.some(inputs, 1)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.some(inputs, 1)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });


    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.some(input, 1)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.some(input, 1)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("some promises are cancelled immediately", function() {
        var resolve;
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){resolve = arguments[0];});

        p1.cancel();
        p2.cancel();
        resolve(1);
        return Promise.some([p1, p2, p3], 1).then(function(result) {
            assert.deepEqual([1], result);
        });
    });

    specify("some promises are cancelled eventually", function() {
        var resolve;
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){resolve = arguments[0];});

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
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){resolve = arguments[0];});

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
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){resolve = arguments[0];});

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
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){});
        var result = new Promise(function(){resolve = arguments[0];});

        p1.cancel();
        p2.cancel();
        p3.cancel();
        Promise.some([p1, p2, p3], 1).then(assert.fail, assert.fail).lastly(resolve);
        return result;
    });

    specify("all promises cancel, not enough for fulfillment - eventually", function() {
        var resolve;
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){});
        var result = new Promise(function(){resolve = arguments[0];});

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
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){reject = arguments[1];});

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
        var p1 = new Promise(function(){});
        var p2 = new Promise(function(){});
        var p3 = new Promise(function(){reject = arguments[1];});

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
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        initialValue.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("initialValue eventually cancelled immediate input", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            initialValue.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });

    specify("initialValue eventually cancelled eventual input", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){});
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            initialValue.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });

    specify("initialValue immediately cancelled eventual input", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){});
        initialValue.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("returned promise cancels immediately", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(a, b) {
            finalled++;
            var ret = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
            ret.cancel();
            return ret;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });

        return awaitLateQueue(function() {
            assert.equal(3, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("returned promise cancels eventually", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        Promise.reduce(inputs, function(a, b) {
            finalled++;
            var ret = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
            awaitLateQueue(function() {
                ret.cancel();
            });
            return ret;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });

        return awaitLateQueue(function() {
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(3, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });

    specify("input immediately cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){});
        inputs.cancel();
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("input eventually cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){});
        Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            inputs.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("output immediately cancelled while waiting inputs", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++});

        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(3, finalled);
            assert.equal(3, cancelled);
        });
    });

    specify("output immediately cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(5, finalled);
            assert.equal(5, cancelled);
        });
    });

    specify("output immediately cancelled while waiting firstValue", function() {
        var initialValue = 1;
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(4, cancelled);
        });
    });

    specify("output immediately cancelled while waiting firstValue and secondValue", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(4, cancelled);
        });
    });

    specify("output immediately cancelled while waiting for a result", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(a, b) {
            finalled++;
            return new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(3, cancelled);
        });
    });

    specify("output eventually cancelled while waiting inputs", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = new Promise(function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++});

        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(3, finalled);
                    assert.equal(3, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting initialValue", function() {
        var initialValue = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(5, finalled);
                    assert.equal(5, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting firstValue", function() {
        var initialValue = 1;
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }, initialValue).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(4, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting firstValue and secondValue", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(){
            finalled++;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(4, cancelled);
                });
            });
        });
    });

    specify("output eventually cancelled while waiting for a result", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [1, 2,
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];
        var all = Promise.reduce(inputs, function(a, b) {
            finalled++;
            return new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
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
});

describe("Cancellation with .map", function() {
    specify("immediately cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.map(p, function(){}).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        Promise.map(p, function(){}).lastly(resolve);
        return awaitLateQueue(function() {
            p.cancel();
            return result;
        });
    });

    specify("immediately cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
        p.cancel();
        Promise.map([1,2,p], function(){}).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        var p = new Promise(function(){});
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.map(inputs, function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.map(inputs, function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("immediately cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.map(input, function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("eventually cancelled output while waiting on promise-for-input", function() {
        var cancelled = 0;
        var finalled = 0;
        var input = new Promise(function(){}).onCancel(function() {
            cancelled++;
        }).lastly(function() {
            finalled++;
        });

        var all = Promise.map(input, function(){})
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        var resolve;
        var result = new Promise(function() {resolve = arguments[0]});
        Promise.delay(1).then(function() {
            all.cancel();
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 2);
                assert.equal(finalled, 2);
            });
        });
    });

    specify("result cancelled immediately while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        var all = Promise.map([1, 2, 3], function(value, index) {
            return new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        all.cancel();
        return awaitLateQueue(function() {
            assert.equal(4, finalled);
            assert.equal(4, cancelled);
        });
    });

    specify("result cancelled eventually while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        var all = Promise.map([1, 2, 3], function(value, index) {
            return new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });

        return awaitLateQueue(function() {
            all.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(4, finalled);
                    assert.equal(4, cancelled);
                });
            });
        });
    });

    specify("returned promise cancelled immediately while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        Promise.map([1, 2, 3], function(value, index) {
            var ret = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
            if (index === 2) {
                ret.cancel();
            }
            return ret;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("returned promise  cancelled eventually while there are in-flight returned promises", function() {
        var cancelled = 0;
        var finalled = 0;

        Promise.map([1, 2, 3], function(value, index) {
            var ret = new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++});
            if (index === 2) {
                awaitLateQueue(function() {
                    ret.cancel();
                });
            }
            return ret;
        }).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });

        return awaitLateQueue(function() {
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });
});
describe("Cancellation with .bind", function() {
    specify("immediately cancelled promise passed as ctx", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){});
        ctx.cancel();
        Promise.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("eventually cancelled promise passed as ctx", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){});
        Promise.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            ctx.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("main promise is immediately cancelled while waiting on binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){});
        var main = new Promise(function(){});
        main.cancel();
        main.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("main promise is eventually cancelled while waiting on binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){});
        var main = new Promise(function(){});

        main.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            main.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("main promise is immediately cancelled with immediate binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(){});
        main.cancel();
        main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            assert.equal(1, finalled);
            assert.equal(1, cancelled);
        });
    });

    specify("main promise is eventually cancelled with immediate binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(){});
        main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            main.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(1, finalled);
                    assert.equal(1, cancelled);
                });
            });
        });
    });

    specify("result is immediately cancelled while waiting for binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){}).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        var result = Promise.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        result.cancel();
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("result is eventually cancelled while waiting for binding", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = new Promise(function(){}).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        var result = Promise.bind(ctx).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            result.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(2, cancelled);
                });
            });
        });
    });

    specify("result is immediately cancelled while waiting for main promise", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(){}).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        var result = main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        result.cancel();
        return awaitLateQueue(function() {
            assert.equal(2, finalled);
            assert.equal(2, cancelled);
        });
    });

    specify("result is eventually cancelled while waiting for main promise", function() {
        var finalled = 0;
        var cancelled = 0;
        var ctx = {};
        var main = new Promise(function(){}).lastly(function() {
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        var result = main.bind(ctx).lastly(function() {
            assert.equal(this, ctx);
            finalled++;
        }).onCancel(function() {
            cancelled++;
        });
        return awaitLateQueue(function() {
            result.cancel();
            return Promise.resolve().then(function() {
                return awaitLateQueue(function() {
                    assert.equal(2, finalled);
                    assert.equal(2, cancelled);
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
        var p = new Promise(function(){});
        p.cancel();
        Promise.join(1,2,p, assert.fail).then(reject, reject).lastly(resolve);
        return result;
    });

    specify("eventually cancelled input inside array", function() {
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        var p = new Promise(function(){});
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.join(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });

    specify("eventually cancelled output", function() {
        var cancelled = 0;
        var finalled = 0;
        var inputs = [
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++}),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
        ];

        var all = Promise.join(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .onCancel(function() {cancelled++})
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
                assert.equal(cancelled, 4);
                assert.equal(finalled, 4);
            });
        });
    });
});

describe("Cancellation with .reflect", function() {
    specify("immediately cancelled", function() {
        var promise = new Promise(function(){});
        promise.cancel();
        return promise.reflect().then(function(value) {
            assert(!value.isFulfilled());
            assert(!value.isRejected());
            assert(value.isPending());
        });
    });

    specify("eventually cancelled", function() {
        var promise = new Promise(function(){});

        var ret = promise.reflect().then(function(value) {
            assert(!value.isFulfilled());
            assert(!value.isRejected());
            assert(value.isPending());
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
        var p = new Promise(function(){});
        p.cancel();

        var disposerCalled = false;
        var disposable = new Promise(function(){
            setTimeout(arguments[0], 1);
        }).disposer(function() {
            disposerCalled = true;
        });

        Promise.using(1, disposable, p, assert.fail).then(reject, reject).lastly(function() {
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
        var p = new Promise(function(){});

        var disposerCalled = false;
        var disposable = new Promise(function(){
            setTimeout(arguments[0], 1);
        }).disposer(function() {
            disposerCalled = true;
        });

        Promise.using(1,disposable,p, assert.fail).then(reject, reject).lastly(function() {
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
        var p = new Promise(function(){});

        var disposerCalled = false;
        var disposable = new Promise(function(){fulfillResource = arguments[0];}).disposer(function() {
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .onCancel(function() {cancelled++})
            .lastly(function() {finalled++; resolve(); });

        all.cancel();
        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 4);
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .onCancel(function() {cancelled++})
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
                assert.equal(cancelled, 4);
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
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){fulfillResource = arguments[0];})
                .disposer(function() {
                    disposerCalled++;
                }),
            new Promise(function(){})
                .onCancel(function() {cancelled++})
                .lastly(function() {finalled++})
                .disposer(function() {
                    disposerCalled++;
                })
        ];

        var all = Promise.using(inputs[0], inputs[1], inputs[2], assert.fail)
            .then(reject, reject)
            .onCancel(function() {cancelled++})
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
                assert.equal(cancelled, 3);
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
            var ret = new Promise(function() {});
            all.cancel();
            return ret;
        }).then(reject, reject)
           .onCancel(function() {cancelled++})
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
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
            var ret = new Promise(function() {});
            Promise.delay(1).then(function() {
                all.cancel();
            });
            return ret;
        }).then(reject, reject)
           .onCancel(function() {cancelled++})
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
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

        var all = Promise.using(resource1, resource2, function(res1, res2) {
            var ret = new Promise(function() {});
            ret.cancel();
            return ret;
        }).then(reject, reject)
           .onCancel(function() {cancelled++})
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
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
            var ret = new Promise(function() {});
            Promise.delay(1).then(function() {
                ret.cancel();
            });
            return ret;
        }).then(reject, reject)
           .onCancel(function() {cancelled++})
           .lastly(function() {finalled++; resolve(); });

        var resolve, reject;
        var result = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });

        return result.then(function() {
            return awaitLateQueue(function() {
                assert.equal(cancelled, 1);
                assert.equal(finalled, 1);
                assert.equal(disposerCalled, 2);
            });
        });
    });
});
