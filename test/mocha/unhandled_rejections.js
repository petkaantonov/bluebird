"use strict";
var assert = require("assert");
var Promise = require("../../js/debug/bluebird.js");
var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;


//Since there is only a single handler possible at a time, older
//tests that are run just before this file could affect the results
//that's why there is 500ms limit in grunt file between each test
//beacuse the unhandled rejection handler will run within 100ms right now
function onUnhandledFail() {
    Promise.onPossiblyUnhandledRejection(function(e){
        assert.fail("Reporting handled rejection as unhandled");
    });
}

function onUnhandledSucceed( done, testAgainst ) {
    Promise.onPossiblyUnhandledRejection(function(e){
         if( testAgainst !== void 0 ) {
            if( typeof testAgainst === "function" ) {
                assert(testAgainst(e));
            }
            else {
                assert.equal(testAgainst, e );
            }
         }
         onDone(done)();
    });
}

function onDone(done) {
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


        specify("Immediately rejected not handled at all", function(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            promise.reject(e());
        });
        specify("Eventually rejected not handled at all", function(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            setTimeout(function(){
                promise.reject(e());
            }, 50);
        });



        specify("Immediately rejected handled too late", function(done) {
            onUnhandledSucceed(done);
            var promise = pending();
            promise.reject(e());
            setTimeout( function() {
                promise.promise.caught(function(){});
            }, 120 );
        });
        specify("Eventually rejected handled too late", function(done) {
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

        specify("Immediately fulfilled handled with erroneous code", function(done) {
            onUnhandledSucceed(done);
            var deferred = pending();
            var promise = deferred.promise;
            deferred.fulfill(null);
            promise.then(function(itsNull){
                itsNull.will.fail.four.sure();
            });
        });
        specify("Eventually fulfilled handled with erroneous code", function(done) {
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

        specify("Already fulfilled handled with erroneous code but then recovered and failed again", function(done) {
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

        specify("Immediately fulfilled handled with erroneous code but then recovered and failed again", function(done) {
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

        specify("Eventually fulfilled handled with erroneous code but then recovered and failed again", function(done) {
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

        specify("Already fulfilled handled with erroneous code but then recovered in a parallel handler and failed again", function(done) {
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

    specify("Immediately rejected with non instanceof Error", function(done) {
        onUnhandledSucceed(done);

        var failed = pending();
        failed.reject(notE());
    });


    specify("Eventually rejected with non instanceof Error", function(done) {
        onUnhandledSucceed(done);

        var failed = pending();

        setTimeout(function(){
            failed.reject(notE());
        }, 80 );
    });
});

describe("Will handle hostile rejection reasons like frozen objects", function() {

    specify("Immediately rejected with non instanceof Error", function(done) {
        onUnhandledSucceed(done, function(e) {
            return e.__promiseHandled__ > 0;
        });


        var failed = pending();
        failed.reject(Object.freeze(new Error()));
    });


    specify("Eventually rejected with non instanceof Error", function(done) {
        onUnhandledSucceed(done, function(e) {
            return e.__promiseHandled__ > 0;
        });


        var failed = pending();

        setTimeout(function(){
            failed.reject(Object.freeze({}));
        }, 80 );
    });
});

describe("Will not report rejections that are handled in time", function() {


    specify("Already rejected handled", function(done) {
        onUnhandledFail();

        var failed = rejected(e());

        failed.caught(function(){

        });

        setTimeout( onDone(done), 175 );
    });

    specify("Immediately rejected handled", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.caught(function(){

        });

        failed.reject(e());

        setTimeout( onDone(done), 175 );

    });


    specify("Eventually rejected handled", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.caught(function(){

        });

        setTimeout(function(){
            failed.reject(e());
        }, 80 );

        setTimeout( onDone(done), 175 );

    });




    specify("Already rejected handled in a deep sequence", function(done) {
        onUnhandledFail();

        var failed = rejected(e());

        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(function(){
            });


        setTimeout( onDone(done), 175 );
    });

    specify("Immediately rejected handled in a deep sequence", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(function(){

        });


        failed.reject(e());

        setTimeout( onDone(done), 175 );

    });


    specify("Eventually handled in a deep sequence", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .caught(function(){

        });


        setTimeout(function(){
            failed.reject(e());
        }, 80 );

        setTimeout( onDone(done), 175 );

    });


    specify("Already rejected handled in a middle parallel deep sequence", function(done) {
        onUnhandledFail();

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


        setTimeout( onDone(done), 175 );
    });

    specify("Immediately rejected handled in a middle parallel deep  sequence", function(done) {
        onUnhandledFail();

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

        setTimeout( onDone(done), 175 );

    });


    specify("Eventually handled in a middle parallel deep sequence", function(done) {
        onUnhandledFail();

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
        }, 80 );

        setTimeout( onDone(done), 175 );

    });


});
