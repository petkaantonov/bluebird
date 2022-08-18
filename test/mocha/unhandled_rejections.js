"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var noop = testUtils.noop;
var isStrictModeSupported = testUtils.isStrictModeSupported;
var onUnhandledFail = testUtils.onUnhandledFail;
var onUnhandledSucceed = testUtils.onUnhandledSucceed;

function yesE() {
    return new Error();
}

function notE() {
    var rets = [{}, []];
    return rets[Math.random()*rets.length|0];
}

function cleanUp() {
    Promise.onPossiblyUnhandledRejection(null);
    Promise.onUnhandledRejectionHandled(null);
}

function setupCleanUps() {
    beforeEach(cleanUp);
    afterEach(cleanUp);
}

describe("Will report rejections that are not handled in time", function() {
    setupCleanUps();

    specify("Immediately rejected not handled at all", function testFunction() {
        var promise = Promise.defer();
        promise.reject(yesE());
        return onUnhandledSucceed();
    });

    specify("Eventually rejected not handled at all", function testFunction() {
        var promise = Promise.defer();
        setTimeout(function(){
            promise.reject(yesE());
        }, 1);
        return onUnhandledSucceed();
    });

    specify("Immediately rejected handled too late", function testFunction() {
        var promise = Promise.defer();
        promise.reject(yesE());
        setTimeout(function() {
            promise.promise.then(assert.fail, function(){});
        }, 150);
        return onUnhandledSucceed();
    });
    specify("Eventually rejected handled too late", function testFunction() {
        var promise = Promise.defer();
        setTimeout(function(){
            promise.reject(yesE());
            setTimeout(function() {
                promise.promise.then(assert.fail, function(){});
            }, 150);
        }, 1);

        return onUnhandledSucceed();
    });
});

describe("Will report rejections that are code errors", function() {
    setupCleanUps();

    specify("Immediately fulfilled handled with erroneous code", function testFunction() {
        var deferred = Promise.defer();
        var promise = deferred.promise;
        deferred.fulfill(null);
        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        });
        return onUnhandledSucceed();
    });
    specify("Eventually fulfilled handled with erroneous code", function testFunction() {
        var deferred = Promise.defer();
        var promise = deferred.promise;
        setTimeout(function(){
            deferred.fulfill(null);
        }, 1);
        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        });
        return onUnhandledSucceed();
    });

    specify("Already fulfilled handled with erroneous code but then recovered and failDeferred again", function testFunction() {
        var err = yesE();
        var promise = Promise.resolve(null);
        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        }).then(assert.fail, function(e){
            assert.ok(e instanceof Promise.TypeError);
        }).then(function(){
            //then assert.failing again
            //this error should be reported
            throw err;
        });
        return onUnhandledSucceed(err);
    });

    specify("Immediately fulfilled handled with erroneous code but then recovered and failDeferred again", function testFunction() {
        var err = yesE();
        var deferred = Promise.defer();
        var promise = deferred.promise;
        deferred.fulfill(null);
        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        }).then(assert.fail, function(e){
                assert.ok(e instanceof Promise.TypeError)
            //Handling the type error here
        }).then(function(){
            //then assert.failing again
            //this error should be reported
            throw err;
        });
        return onUnhandledSucceed(err);
    });

    specify("Eventually fulfilled handled with erroneous code but then recovered and failDeferred again", function testFunction() {
        var err = yesE();
        var deferred = Promise.defer();
        var promise = deferred.promise;

        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        }).then(assert.fail, function(e){
                assert.ok(e instanceof Promise.TypeError)
            //Handling the type error here
        }).then(function(){
            //then assert.failing again
            //this error should be reported
            throw err;
        });

        setTimeout(function(){
            deferred.fulfill(null);
        }, 1);
        return onUnhandledSucceed(err);
    });

    specify("Already fulfilled handled with erroneous code but then recovered in a parallel handler and failDeferred again", function testFunction() {
        var err = yesE();
        var promise = Promise.resolve(null);
        promise.then(function(itsNull){
            itsNull.will.fail.four.sure();
        }).then(assert.fail, function(e){
            assert.ok(e instanceof Promise.TypeError)
        });

        promise.then(function(){
            //then assert.failing again
            //this error should be reported
            throw err;
        });
        return onUnhandledSucceed(err);
    });
});

describe("Will report rejections that are not instanceof Error", function() {
    setupCleanUps();

    specify("Immediately rejected with non instanceof Error", function testFunction() {
        var failDeferred = Promise.defer();
        failDeferred.reject(notE());
        return onUnhandledSucceed();
    });

    specify("Eventually rejected with non instanceof Error", function testFunction() {
        var failDeferred = Promise.defer();
        setTimeout(function(){
            failDeferred.reject(notE());
        }, 1);
        return onUnhandledSucceed();
    });
});

describe("Will handle hostile rejection reasons like frozen objects", function() {
    setupCleanUps();

    specify("Immediately rejected with non instanceof Error", function testFunction() {
        var failDeferred = Promise.defer();
        failDeferred.reject(Object.freeze({}));
        return onUnhandledSucceed(function(e) {
            return true;
        });
    });


    specify("Eventually rejected with non instanceof Error", function testFunction() {
        var failDeferred = Promise.defer();
        var obj = {};
        setTimeout(function(){
            failDeferred.reject(Object.freeze(obj));
        }, 1);
        return onUnhandledSucceed(function(e) {
            return e === obj;
        });
    });
});


describe("Will not report rejections that are handled in time", function() {
    setupCleanUps();

    specify("Already rejected handled", function testFunction() {
        var failDeferred = Promise.reject(yesE()).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Immediately rejected handled", function testFunction() {
        var failDeferred = Promise.defer();
        failDeferred.promise.caught(noop);
        failDeferred.reject(yesE());
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });


    specify("Eventually rejected handled", function testFunction() {
        var failDeferred = Promise.defer();
        setTimeout(function() {
            failDeferred.reject(yesE());
        }, 1);
        failDeferred.promise.caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Already rejected handled in a deep sequence", function testFunction() {
        var failDeferred = Promise.reject(yesE());

        failDeferred
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Immediately rejected handled in a deep sequence", function testFunction() {
        var failDeferred = Promise.defer();

        failDeferred.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(noop);


        failDeferred.reject(yesE());
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });


    specify("Eventually handled in a deep sequence", function testFunction() {
        var failDeferred = Promise.defer();
        setTimeout(function() {
            failDeferred.reject(yesE());
        }, 1);
        failDeferred.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });


    specify("Already rejected handled in a middle parallel deep sequence", function testFunction() {
        var failDeferred = Promise.reject(yesE());

        failDeferred
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});


        failDeferred
            .then(function(){})
            .then(function(){}, null, function(){})
            .then(assert.fail, function(){
            });

        failDeferred
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        return onUnhandledSucceed(undefined, 2);
    });


    specify("Immediately rejected handled in a middle parallel deep  sequence", function testFunction() {
        var failDeferred = Promise.defer();

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then(assert.fail, function(){
            });

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failDeferred.reject(yesE());
        return onUnhandledSucceed(undefined, 2);
    });


    specify("Eventually handled in a middle parallel deep sequence", function testFunction() {
        var failDeferred = Promise.defer();

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then(assert.fail, function(){
            });

        failDeferred.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});


        setTimeout(function(){
            failDeferred.reject(yesE());
        }, 1);
        return onUnhandledSucceed(undefined, 2);
    });
});

describe("immediate assert.failures without .then", function testFunction() {
    setupCleanUps();
    var err = new Error('');
    specify("Promise.reject", function testFunction() {
        Promise.reject(err);
        return onUnhandledSucceed(function(e) {
            return e === err;
        });
    });

    specify("new Promise throw", function testFunction() {
        new Promise(function() {
            throw err;
        });
        return onUnhandledSucceed(function(e) {
            return e === err;
        });
    });

    specify("new Promise reject", function testFunction() {
        new Promise(function(_, r) {
            r(err);
        });
        return onUnhandledSucceed(function(e) {
            return e === err;
        });
    });

    specify("Promise.method", function testFunction() {
        Promise.method(function() {
            throw err;
        })();
        return onUnhandledSucceed(function(e) {
            return e === err;
        });
    });

    specify("Promise.all", function testFunction() {
        Promise.all([Promise.reject(err)]);
        return onUnhandledSucceed(function(e) {
            return e === err;
        });
    });
});


describe("immediate assert.failures with .then", function testFunction() {
    setupCleanUps();
    var err = new Error('');
    specify("Promise.reject", function testFunction() {
        Promise.reject(err).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("new Promise throw", function testFunction() {
        new Promise(function() {
            throw err;
        }).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("new Promise reject", function testFunction() {
        new Promise(function(_, r) {
            r(err);
        }).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Promise.method", function testFunction() {
        Promise.method(function() {
            throw err;
        })().caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Promise.all", function testFunction() {
        Promise.all([Promise.reject("err")])
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Promise.all many", function testFunction() {
        Promise.all([Promise.reject("err"), Promise.reject("err2")])
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Promise.all many, latter async", function testFunction() {
        Promise.all([Promise.reject("err"), Promise.delay(1).thenThrow(new Error())])
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Promise.all many pending", function testFunction() {
        var a = new Promise(function(v, w){
            setTimeout(function(){w("err");}, 1);
        });
        var b = new Promise(function(v, w){
            setTimeout(function(){w("err2");}, 1);
        });

        Promise.all([a, b])
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("Already rejected promise for a collection", function testFunction(){
        Promise.settle(Promise.reject(err))
            .caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });
});

describe("gh-118", function() {
    setupCleanUps();
    specify("eventually rejected promise", function testFunction() {
        Promise.resolve().then(function() {
            return new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(13);
                }, 1);
            });
        }).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("already rejected promise", function testFunction() {
        Promise.resolve().then(function() {
            return Promise.reject(13);
        }).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });

    specify("immediately rejected promise", function testFunction() {
        Promise.resolve().then(function() {
            return new Promise(function(_, reject) {
                reject(13);
            });
        }).caught(noop);
        return onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
    });
});

describe("Promise.onUnhandledRejectionHandled", function() {
    specify("should be called when unhandled promise is later handled", function() {
        var unhandledPromises = [];
        var spy1 = testUtils.getSpy();
        var spy2 = testUtils.getSpy();

        Promise.onPossiblyUnhandledRejection(spy1(function(reason, promise) {
            unhandledPromises.push({
                reason: reason,
                promise: promise
            });
        }));

        Promise.onUnhandledRejectionHandled(spy2(function(promise) {
            assert.equal(unhandledPromises.length, 1);
            assert(unhandledPromises[0].promise === promise);
            assert(promise === a);
            assert(unhandledPromises[0].reason === reason);
        }));

        var reason = new Error("error");
        var a = new Promise(function(){
            throw reason;
        });

        setTimeout(function() {
            Promise._unhandledRejectionCheck();
            a.then(assert.fail, function(){});
        }, 1);

        return Promise.all([spy1.promise, spy2.promise]);
    });
});

describe("global events", function() {
    var attachGlobalHandler, detachGlobalHandlers;
    if (typeof process !== "undefined" &&
        typeof process.version === "string" &&
        typeof window === "undefined") {
        attachGlobalHandler = function(name, fn) {
            process.on(name, fn);
        };
        detachGlobalHandlers = function() {
            process.removeAllListeners("unhandledRejection");
            process.removeAllListeners("rejectionHandled");
        };
    } else {
        attachGlobalHandler = function(name, fn) {
            window[("on" + name).toLowerCase()] = fn;
        };
        detachGlobalHandlers = function() {
            window.onunhandledrejection = null;
            window.onrejectionhandled = null;
        };
    }
    setupCleanUps();
    beforeEach(detachGlobalHandlers);
    afterEach(detachGlobalHandlers);
    specify("are fired", function() {
        return new Promise(function(resolve, reject) {
            var err = new Error();
            var receivedPromise;
            attachGlobalHandler("unhandledRejection", function(reason, promise) {
                assert.strictEqual(reason, err);
                receivedPromise = promise;
            });
            attachGlobalHandler("rejectionHandled", function(promise) {
                assert.strictEqual(receivedPromise, promise);
                resolve();
            });

            var promise = new Promise(function() {throw err;});
            setTimeout(function() {
                Promise._unhandledRejectionCheck();
                promise.then(assert.fail, function(){});
            }, 1);
        });
    });

    specify("are fired with local events", function() {
        return new Promise(function(resolve, reject) {
            var expectedOrder = [1, 2, 3, 4];
            var order = [];
            var err = new Error();
            var receivedPromises = [];

            Promise.onPossiblyUnhandledRejection(function(reason, promise) {
                assert.strictEqual(reason, err);
                receivedPromises.push(promise);
                order.push(1);
            });

            Promise.onUnhandledRejectionHandled(function(promise) {
                assert.strictEqual(receivedPromises[0], promise);
                order.push(3);
            });

            attachGlobalHandler("unhandledRejection", function(reason, promise) {
                assert.strictEqual(reason, err);
                receivedPromises.push(promise);
                order.push(2);
            });

            attachGlobalHandler("rejectionHandled", function(promise) {
                assert.strictEqual(receivedPromises[1], promise);
                order.push(4);
                assert.deepEqual(expectedOrder, order);
                assert.strictEqual(receivedPromises.length, 2);
                resolve();
            });

            var promise = new Promise(function() {throw err;});
            setTimeout(function() {
                Promise._unhandledRejectionCheck();
                promise.then(assert.fail, function(){});
            }, 1);
        });

    });
});
var windowDomEventSupported = true;
try {
    var event = document.createEvent("CustomEvent");
    event.initCustomEvent("testingtheevent", false, true, {});
    self.dispatchEvent(event);
} catch (e) {
    windowDomEventSupported = false;
}
if (windowDomEventSupported) {
    describe("dom events", function() {
        var events = [];

        beforeEach(detachEvents);
        afterEach(detachEvents);
        function detachEvents() {
            events.forEach(function(e) {
                self.removeEventListener(e.type, e.fn, false);
            });
            events = [];
        }

        function attachEvent(type, fn) {
            events.push({type: type, fn: fn});
            self.addEventListener(type, fn, false);
        }

        specify("are fired", function() {
            return new Promise(function(resolve, reject) {
                var order = [];
                var err = new Error();
                var promise = Promise.reject(err);
                attachEvent("unhandledrejection", function(e) {
                    e.preventDefault();
                    assert.strictEqual(e.detail.promise, promise);
                    assert.strictEqual(e.detail.reason, err);
                    assert.strictEqual(e.promise, promise);
                    assert.strictEqual(e.reason, err);
                    order.push(1);
                });
                attachEvent("unhandledrejection", function(e) {
                    assert.strictEqual(e.detail.promise, promise);
                    assert.strictEqual(e.detail.reason, err);
                    assert.strictEqual(e.promise, promise);
                    assert.strictEqual(e.reason, err);
                    assert.strictEqual(e.defaultPrevented, true);
                    order.push(2);
                });
                attachEvent("rejectionhandled", function(e) {
                    e.preventDefault();
                    assert.strictEqual(e.detail.promise, promise);
                    assert.strictEqual(e.detail.reason, undefined);
                    assert.strictEqual(e.promise, promise);
                    assert.strictEqual(e.reason, undefined);
                    order.push(3);
                });
                attachEvent("rejectionhandled", function(e) {
                    assert.strictEqual(e.detail.promise, promise);
                    assert.strictEqual(e.detail.reason, undefined);
                    assert.strictEqual(e.promise, promise);
                    assert.strictEqual(e.reason, undefined);
                    assert.strictEqual(e.defaultPrevented, true);
                    order.push(4);
                    resolve();
                });

                setTimeout(function() {
                    Promise._unhandledRejectionCheck();
                    promise.then(assert.fail, function(r) {
                        order.push(5);
                        assert.strictEqual(r, err);
                        assert.deepEqual(order, [1,2,3,4,5]);
                    });
                }, 1);
            });

        })
    });

    if (typeof Worker !== "undefined") {
        describe("dom events in a worker", function() {
            var worker;
            beforeEach(function () {
                worker = new Worker("./worker.js");
            });

            afterEach(function () {
                worker.terminate();
            });

            specify("are fired", function() {
                var order = [];
                return new Promise(function(resolve, reject) {
                    worker.onmessage = function (message) {
                        try {
                            switch(message.data) {
                            case "unhandledrejection":
                                order.push(1);
                                break;
                            case "rejectionhandled":
                                order.push(2);
                                resolve();
                                break;
                            default:
                                throw new Error("unexpected message: " + message);
                            }
                        }
                        catch (e) {
                            reject(e);
                        }
                    };

                    worker.postMessage("reject");
                }).then(function () {
                    assert.deepEqual(order, [1, 2]);
                });
            });
        });
    }

}

describe("Unhandled rejection when joining chains with common rejected parent", function testFunction() {
    specify("GH 645", function() {
        var aError = new Error('Something went wrong');
        var a = Promise.try(function(){
            throw aError;
        });

        var b = Promise.try(function(){
            throw new Error('Something went wrong here as well');
        });

        var c = Promise
            .join(a, b)
            .spread(function( a, b ){
                return a+b;
            });

        var test1 = Promise
            .join(a, c)
            .spread(function( a, product ){
                // ...
            })
            .caught(Error, function(e) {
                assert.strictEqual(aError, e);
            });

         var test2 = onUnhandledFail(testFunction);

         return Promise.all([test1, test2]);
    });
});

var asyncAwaitSupported = (function() {
    try {
        new Function("async function abc() {}");
        return true;
    } catch (e) {
        return false;
    }
})();

if (asyncAwaitSupported) {
    describe("No unhandled rejection from async await", function () {
        setupCleanUps();
        specify("gh-1404", function testFunction() {
            var ret = onUnhandledFail(testFunction);
            Promise.using(Promise.resolve(),
                (new Function("Bluebird", "return async function() { await Bluebird.reject(new Error('foo')); }"))(Promise))
            .caught(function() {});
            return ret;
        });
    });
}

describe("issues", function () {
    setupCleanUps();

    specify("GH-1501-1", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        Promise.reduce([Promise.resolve("foo"), Promise.reject(new Error("reason"), Promise.resolve("bar"))],
            function() {},
            {}).caught(function() {});
        return ret;
    });

    specify("GH-1501-2", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        Promise.reduce([Promise.delay(1), Promise.reject(new Error("reason"))],
            function() {},
            {}).caught(function() {});
        return ret;
    });

    specify("GH-1501-3", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        Promise.reduce([Promise.reject(new Error("reason"))],
            function() {},
            Promise.reject(new Error("reason2"))).caught(function() {});
        return ret;
    });

    specify("GH-1487-1", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var p = Promise.reject( new Error('foo') );
        Promise.map( p, function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-2", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var arr = [ Promise.reject( new Error('foo') ) ];
        Promise.map( arr, function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-3", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var p = Promise.reject( new Error('foo') );
        p.map( function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-4", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var arr = [ Promise.reject( new Error('foo') ) ];
        var p = Promise.resolve( arr );
        p.map( function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-5", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var p = Promise.reject( new Error('foo') );
        Promise.filter( p, function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-6", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var arr = [ Promise.reject( new Error('foo') ) ];
        Promise.filter( arr, function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-7", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var p = Promise.reject( new Error('foo') );
        p.filter( function() {} ).caught( function() {} );
        return ret;
    });

    specify("GH-1487-8", function testFunction() {
        var ret = onUnhandledFail(testFunction);
        var arr = [ Promise.reject( new Error('foo') ) ];
        var p = Promise.resolve( arr );
        p.filter( function() {} ).caught( function() {} );
        return ret;
    });
})
