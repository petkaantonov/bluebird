"use strict";
var assert = require("assert");
var Promise = require("../js/promise.js");
var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

function onUnhandledFail() {
    Promise.onPossiblyUnhandledRejection(function(e){
        if( e.propagationTest ) { //Ignore errors from other tests
            assert.fail("Reporting handled rejection as unhandled");
        }
    });
}

function onUnhandledSucceed( done ) {
    Promise.onPossiblyUnhandledRejection(function(e){
        if( e.propagationTest ) { //Ignore errors from other tests
            onDone(done)();
        }
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

describe("Will report rejections that are not handled in time", function() {
    specify("Already rejected not handled at all", function(done) {
        onUnhandledSucceed(done);
        rejected(e());
    });
    specify("Immediately rejected not handled at all", function(done) {
        onUnhandledSucceed(done);
        var promise = pending();
        promise.reject(e());
    });
    specify("Eventually rejected not handled at all", function(done) {
        onUnhandledSucceed(done);
    });

});

describe("Will not report rejections that are handled in time", function() {


    specify("Already rejected handled", function(done) {
        onUnhandledFail();

        var failed = rejected(e());

        failed.rejected(function(){

        });

        var failed2 = rejected(e());

        setTimeout(function(){
            failed2.rejected(function(){

            });
        }, 40);

        setTimeout( onDone(done), 175 );
    });

    specify("Immediately rejected handled", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.rejected(function(){

        });

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise.rejected(function(){

            });
        }, 40);


        failed.reject(e());
        failed2.reject(e());

        setTimeout( onDone(done), 175 );

    });


    specify("Eventually rejected handled", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.rejected(function(){

        });

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise.rejected(function(){

            });
        }, 40);

        setTimeout(function(){
            failed.reject(e());
            failed2.reject(e());
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
            .rejected(function(){
            });

        var failed2 = rejected(e());

        setTimeout(function(){
            failed2
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){})
                .rejected(function(){
                });
        }, 40);

        setTimeout( onDone(done), 175 );
    });

    specify("Immediately rejected handled in a deep sequence", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .rejected(function(){

        });

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){})
                .rejected(function(){

            });
        }, 40);



        failed.reject(e());
        failed2.reject(e());

        setTimeout( onDone(done), 175 );

    });


    specify("Eventually handled in a deep sequence", function(done) {
        onUnhandledFail();

        var failed = pending();

        failed.promise.then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){})
            .rejected(function(){

        });

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){})
                .rejected(function(){
            });
        }, 40);

        setTimeout(function(){
            failed.reject(e());
            failed2.reject(e());
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
            .rejected(function(){
            });

        failed
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        var failed2 = rejected(e());

        setTimeout(function(){
            failed2
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});

            failed2
                .then(function(){})
                .then(function(){}, null, function(){})
                .rejected(function(){

                });

            failed2
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});
        }, 40);

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
            .rejected(function(){
            });

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});

            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .rejected(function(){
                });

            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});
        }, 40);



        failed.reject(e());
        failed2.reject(e());

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
            .rejected(function(){
            });

        failed.promise
            .then(function(){})
            .then(function(){}, null, function(){})
            .then()
            .then(function(){});

        var failed2 = pending();

        setTimeout(function(){
            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});

            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .rejected(function(){
                });

            failed2.promise
                .then(function(){})
                .then(function(){}, null, function(){})
                .then()
                .then(function(){});
        }, 40);

        setTimeout(function(){
            failed.reject(e());
            failed2.reject(e());
        }, 80 );

        setTimeout( onDone(done), 175 );

    });


});