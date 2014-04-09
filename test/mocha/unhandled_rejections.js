"use strict";
var assert = require("assert");
var Promise = require("../../js/debug/bluebird.js");
var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

//Used in expressions like: onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
//If strict mode is supported NFEs work, if it is not, NFEs don't work but arguments.callee does
var isStrictModeSupported = (function() {
    try {
        new Function("'use strict'; with({});");
        return false;
    }
    catch(e) {
        return true;
    }
})();

Promise.onPossiblyUnhandledRejection(null);

//Since there is only a single handler possible at a time, older
//tests that are run just before this file could affect the results
//that's why there is 500ms limit in grunt file between each test
//beacuse the unhandled rejection handler will run within 100ms right now
function onUnhandledFail(testFunction) {
    Promise.onPossiblyUnhandledRejection(function(e) {
        //For IE7 debugging
        console.log(testFunction + "");
        Promise.onPossiblyUnhandledRejection(null);
        assert.fail("Reporting handled rejection as unhandled");
    });
}

function onUnhandledSucceed( done, testAgainst ) {
    Promise.onPossiblyUnhandledRejection(function(e){
         if( testAgainst !== void 0 ) {
            try {
                if( typeof testAgainst === "function" ) {
                    assert(testAgainst(e));
                }
                else {
                    assert.equal(testAgainst, e );
                }
            }
            catch(e) {
                Promise.onPossiblyUnhandledRejection(null);
                if( typeof testAgainst === "function" ) {
                    console.log("assertion failed: " + testAgainst);
                }
                else {
                    console.log("assertion failed: " + testAgainst +  "!== " + e);
                }
                return;
            }
         }
        setTimeout(function() {
            clearUnhandledHandler(done)();
        }, 50);
    });
}

function async(fn) {
    return function() {
        setTimeout(function(){fn()}, 13);
    };
}

function clearUnhandledHandler(done) {
    return function() {
        Promise.onPossiblyUnhandledRejection(null);
        done();
    };
};

function e() {
    var ret = new Error();
    ret.propagationTest = true;
    return ret;
}

function notE() {
    var rets = [{}, []];
    return rets[Math.random()*rets.length|0];
}


if( adapter.hasLongStackTraces() ) {
    describe("Will report rejections that are not handled in time", function() {


        specify("Immediately rejected not handled at all", function testFunction(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            promise.reject(e());
        });
        specify("Eventually rejected not handled at all", function testFunction(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            setTimeout(function(){
                promise.reject(e());
            }, 50);
        });



        specify("Immediately rejected handled too late", function testFunction(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            promise.reject(e());
            setTimeout( function() {
                promise.promise.caught(function(){});
            }, 120 );
        });
        specify("Eventually rejected handled too late", function testFunction(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            setTimeout(function(){
                promise.reject(e());
            }, 20);
            setTimeout( function() {
                promise.promise.caught(function(){});
            }, 160 );
        });
    });

    describe("Will report rejections that are code errors", function() {

        specify("Immediately fulfilled handled with erroneous code", function testFunction(done) {
            onUnhandledSucceed(done);
            var deferred = pending();
            var promise = deferred.promise;
            deferred.fulfill(null);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            });
        });
        specify("Eventually fulfilled handled with erroneous code", function testFunction(done) {
            onUnhandledSucceed(done);
            var deferred = pending();
            var promise = deferred.promise;
            setTimeout(function(){
                deferred.fulfill(null);
            }, 40);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            });
        });

        specify("Already fulfilled handled with erroneous code but then recovered and failed again", function testFunction(done) {
            var err = e();
            onUnhandledSucceed(done, err);
            var promise = fulfilled(null);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            }).caught(function(e){
                    assert.ok( e instanceof Promise.TypeError )
            }).then(function(){
                //then failing again
                //this error should be reported
                throw err;
            });
        });

        specify("Immediately fulfilled handled with erroneous code but then recovered and failed again", function testFunction(done) {
            var err = e();
            onUnhandledSucceed(done, err);
            var deferred = pending();
            var promise = deferred.promise;
            deferred.fulfill(null);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            }).caught(function(e){
                    assert.ok( e instanceof Promise.TypeError )
                //Handling the type error here
            }).then(function(){
                //then failing again
                //this error should be reported
                throw err;
            });
        });

        specify("Eventually fulfilled handled with erroneous code but then recovered and failed again", function testFunction(done) {
            var err = e();
            onUnhandledSucceed(done, err);
            var deferred = pending();
            var promise = deferred.promise;

            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            }).caught(function(e){
                    assert.ok( e instanceof Promise.TypeError )
                //Handling the type error here
            }).then(function(){
                //then failing again
                //this error should be reported
                throw err;
            });

            setTimeout(function(){
                deferred.fulfill(null);
            }, 40 );
        });

        specify("Already fulfilled handled with erroneous code but then recovered in a parallel handler and failed again", function testFunction(done) {
            var err = e();
            onUnhandledSucceed(done, err);
            var promise = fulfilled(null);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            }).caught(function(e){
                    assert.ok( e instanceof Promise.TypeError )
            });

            promise.caught(function(e) {
                    assert.ok( e instanceof Promise.TypeError )
                //Handling the type error here
            }).then(function(){
                //then failing again
                //this error should be reported
                throw err;
            });
        });
    });

}

describe("Will report rejections that are not instanceof Error", function() {

    specify("Immediately rejected with non instanceof Error", function testFunction(done) {
        onUnhandledSucceed(done);

        var failed = pending();
        failed.reject(notE());
    });


    specify("Eventually rejected with non instanceof Error", function testFunction(done) {
        onUnhandledSucceed(done);

        var failed = pending();

        setTimeout(function(){
            failed.reject(notE());
        }, 80 );
    });
});

describe("Will handle hostile rejection reasons like frozen objects", function() {

    specify("Immediately rejected with non instanceof Error", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return true;
        });


        var failed = pending();
        failed.reject(Object.freeze({}));
    });


    specify("Eventually rejected with non instanceof Error", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e instanceof Error;
        });


        var failed = pending();

        setTimeout(function(){
            failed.reject(Object.freeze({}));
        }, 80 );
    });
});


describe("Will not report rejections that are handled in time", function() {


    specify("Already rejected handled", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
        var failed = rejected(e()).caught(async(clearUnhandledHandler(done)));
    });

    specify("Immediately rejected handled", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var failed = pending();

        failed.promise.caught(async(clearUnhandledHandler(done)));

        failed.reject(e());
    });


    specify("Eventually rejected handled", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var failed = pending();
        async(function() {
            failed.reject(e());
        })();
        failed.promise.caught(async(clearUnhandledHandler(done)));
    });

    specify("Already rejected handled in a deep sequence", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var failed = rejected(e());

        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(async(clearUnhandledHandler(done)));
    });

    specify("Immediately rejected handled in a deep sequence", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var failed = pending();

        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(async(clearUnhandledHandler(done)));


        failed.reject(e());
    });


    specify("Eventually handled in a deep sequence", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var failed = pending();
        async(function(){
            failed.reject(e());
        })();
        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(async(clearUnhandledHandler(done)));
    });


    specify("Already rejected handled in a middle parallel deep sequence", function testFunction(done) {
        var totalReported = 0;
        Promise.onPossiblyUnhandledRejection(function () {
            totalReported++;
            if (totalReported === 2) {
                setTimeout(function(){
                    assert.equal(totalReported, 2);
                    Promise.onPossiblyUnhandledRejection(null);
                    done();
                }, 13);
            }
        });

        var failed = rejected(e());

        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});


        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .caught(function(){
            });

        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});
    });


    specify("Immediately rejected handled in a middle parallel deep  sequence", function testFunction(done) {
        var totalReported = 0;
        Promise.onPossiblyUnhandledRejection(function () {
            totalReported++;
            if (totalReported === 2) {
                setTimeout(function(){
                    assert.equal(totalReported, 2);
                    Promise.onPossiblyUnhandledRejection(null);
                    done();
                }, 13);
            }
        });

        var failed = pending();

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .caught(function(){
            });

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failed.reject(e());
    });


    specify("Eventually handled in a middle parallel deep sequence", function testFunction(done) {
        var totalReported = 0;
        Promise.onPossiblyUnhandledRejection(function () {
            totalReported++;
            if (totalReported === 2) {
                setTimeout(function(){
                    assert.equal(totalReported, 2);
                    Promise.onPossiblyUnhandledRejection(null);
                    done();
                }, 13);
            }
        });

        var failed = pending();

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .caught(function(){
            });

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});


        setTimeout(function(){
            failed.reject(e());
        }, 13 );

    });
});

describe("immediate failures without .then", function testFunction(done) {
    var err = new Error('');
    specify("Promise.reject", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e === err;
        });

        Promise.reject(err);
    });

    specify("new Promise throw", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e === err;
        });

        new Promise(function() {
            throw err;
        });
    });

    specify("new Promise reject", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e === err;
        });

        new Promise(function(_, r) {
            r(err);
        });
    });

    specify("Promise.method", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e === err;
        });

        Promise.method(function() {
            throw err;
        })();
    });

    specify("Promise.all", function testFunction(done) {
        onUnhandledSucceed(done, function(e) {
            return e === err;
        });

        Promise.all([Promise.reject(err)]);
    });
});


describe("immediate failures with .then", function testFunction(done) {
    var err = new Error('');
    specify("Promise.reject", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
        Promise.reject(err).caught(async(clearUnhandledHandler(done)));
    });

    specify("new Promise throw", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        new Promise(function() {
            throw err;
        }).caught(async(clearUnhandledHandler(done)));
    });

    specify("new Promise reject", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        new Promise(function(_, r) {
            r(err);
        }).caught(async(clearUnhandledHandler(done)));
    });

    specify("Promise.method", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.method(function() {
            throw err;
        })().caught(clearUnhandledHandler(async(done)));
    });

    specify("Promise.all", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.all([Promise.reject("err")])
            .caught(clearUnhandledHandler(async(done)));
    });


    specify("Promise.all many", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.all([Promise.reject("err"), Promise.reject("err2")])
            .caught(clearUnhandledHandler(async(done)));
    });

    specify("Promise.all many pending", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        var a = new Promise(function(v, w){
            setTimeout(function(){w("err");}, 4);
        });
        var b = new Promise(function(v, w){
            setTimeout(function(){w("err2");}, 4);
        });

        Promise.all([a, b])
            .caught(clearUnhandledHandler(async(done)));
    });

    specify("Already rejected promise for a collection", function testFunction(done){
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);
        Promise.settle(Promise.reject(err))
            .caught(clearUnhandledHandler(async(done)));
    });
});

describe("gh-118", function() {
    specify("eventually rejected promise", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.resolve().then(function() {
            return new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(13);
                }, 13);
            });
        }).caught(async(clearUnhandledHandler(done)));
    });

    specify("already rejected promise", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.resolve().then(function() {
            return Promise.reject(13);
        }).caught(async(clearUnhandledHandler(done)));
    });

    specify("immediately rejected promise", function testFunction(done) {
        onUnhandledFail(isStrictModeSupported ? testFunction : arguments.callee);

        Promise.resolve().then(function() {
            return new Promise(function(_, reject) {
                reject(13);
            });
        }).caught(async(clearUnhandledHandler(done)));
    });
});

describe("Promise.onUnhandledRejectionHandled", function() {
    specify("should be called when unhandled promise is later handled", function(done) {
        var unhandledPromises = [];
        Promise.onPossiblyUnhandledRejection(function(reason, promise) {
            unhandledPromises.push({
                reason: reason,
                promise: promise
            });
        });

        Promise.onUnhandledRejectionHandled(function(promise) {
            assert.equal(unhandledPromises.length, 1);
            assert(unhandledPromises[0].promise === promise);
            assert(promise === a);
            assert(unhandledPromises[0].reason === reason);
            Promise.onUnhandledRejectionHandled(null);
            Promise.onPossiblyUnhandledRejection(null);
            done();
        });

        var reason = new Error("error");
        var a = new Promise(function(){
            throw reason;
        });
        setTimeout(function(){
            a.caught(function(){

            });
        }, 25);
    });
});

if (Promise.hasLongStackTraces()) {
    describe("Gives long stack traces for non-errors", function() {

        specify("string", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });


            new Promise(function(){
                throw "hello";
            });

        });

        specify("null", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            new Promise(function(resolve, reject){
                reject(null);
            });

        });

        specify("boolean", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            var d = Promise.defer();
            d.reject(true);
        });

        specify("undefined", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.cast().then(function() {
                throw void 0;
            });
        });

        specify("number", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.cast().then(function() {
                throw void 0;
            }).caught(function(e){return e === void 0}, function() {
                throw 3;
            });
        });

        specify("function", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.cast().then(function() {
                return Promise.reject(function(){});
            });
        });

        specify("pojo", function testFunction(done) {
            var OldPromise = require("./helpers/bluebird0_7_0.js");

            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.cast().then(function() {
                return OldPromise.rejected({});
            });
        });

        specify("Date", function testFunction(done) {
            var OldPromise = require("./helpers/bluebird0_7_0.js");

            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.cast().then(function() {
                return OldPromise.cast().then(function(){
                    throw new Date();
                });
            });
        });

        specify("Q", function testFunction(done) {
            onUnhandledSucceed(done, function(e) {
                return (e.stack.length > 100);
            });

            Promise.resolve(5).then(function(val){
                return "Hello";
            }).delay(5).then(function(val){
                return require("q")().then(function(){throw "Error"});
            });
        });
    });
}

describe("clear unhandled handler", function() {
    Promise.onPossiblyUnhandledRejection(null);
});
