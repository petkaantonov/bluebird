"use strict";

var isNodeJS = typeof process !== "undefined" && process !== null &&
    typeof process.execPath === "string";

var assert = require("assert");
var OldPromise = require("./helpers/bluebird0_7_0.js");

if( isNodeJS ) {
    var Promise1 = require( "../../js/debug/promise.js")();
    var Promise2 = require( "../../js/debug/promise.js")();

    var err1 = new Error();
    var err2 = new Error();

    describe("Separate instances of bluebird", function() {

        specify("Should have identical Error types", function( done ) {
            assert( Promise1.CancellationError === Promise2.CancellationError );
            assert( Promise1.RejectionError === Promise2.RejectionError );
            assert( Promise1.TimeoutError === Promise2.TimeoutError );
            done();
        });

        specify("Should not be identical", function( done ) {
            assert( Promise1.onPossiblyUnhandledRejection !==
                    Promise2.onPossiblyUnhandledRejection );
            assert( Promise1 !== Promise2 );
            done();
        });

        specify("Should have different unhandled rejection handlers", function(done) {
            var dones = 0;
            var donecall = function() {
                if( ++dones === 2 ) {
                    done();
                }
            }
            Promise1.onPossiblyUnhandledRejection(function(e, promise) {
                assert( promise instanceof Promise1 );
                assert( !(promise instanceof Promise2) );
                assert(e === err1);
                donecall();
            });

            Promise2.onPossiblyUnhandledRejection(function(e, promise) {
                assert( promise instanceof Promise2 );
                assert( !(promise instanceof Promise1) );
                assert(e === err2);
                donecall();
            });

            assert( Promise1.onPossiblyUnhandledRejection !==
                    Promise2.onPossiblyUnhandledRejection );

            var d1 = Promise1.pending();
            var d2 = Promise2.pending();

            d1.promise.then(function(){
                throw err1;
            });

            d2.promise.then(function(){
                throw err2;
            });

            setTimeout(function(){
                d1.fulfill();
                d2.fulfill();
            }, 13);
        });

        specify("Should use fast cast", function(done) {
            var a = Promise1.pending();
            var b = Promise2.cast(a.promise);
            assert(a.promise._receiver0 === b);
            done();
        });

        specify("Should pass through progress with fast cast", function(done){
            var a = Promise1.pending();
            var b = Promise2.cast(a.promise);
            var test = 0;
            b.then(function() {
                test++;
            }, null, function() {
                test++;
            });

            a.progress();
            a.resolve();
            setTimeout(function(){
                assert.equal(test, 2);
                done();
            }, 20);
        });

        specify("Should use fast cast with very old version", function(done) {
            var a = OldPromise.pending();
            var b = Promise1.cast(a.promise);
            assert(a.promise._receiver0 === b);
            done();
        });

        specify("Should pass through progress with fast cast with very old version", function(done){
            var a = OldPromise.pending();
            var b = Promise1.cast(a.promise);
            var test = 0;
            b.then(function() {
                test++;
            }, null, function() {
                test++;
            });

            a.progress();
            a.fulfill();
            setTimeout(function(){
                assert.equal(test, 2);
                done();
            }, 20);
        });

        specify("Should return 2 from very old promise", function(done) {
            Promise1.resolve().then(
                function(){ return OldPromise.cast(0).then(function(){return 2});
            }).then(function(two){
                assert.equal(two, 2);
                done();
            });
        });
    });

}
