"use strict";

var assert = require("assert");

var Promise1 = require( "../../js/debug/promise.js")();
var Promise2 = require( "../../js/debug/promise.js")();

var err1 = new Error();
var err2 = new Error();


describe("Separate instances of bluebird", function(){

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

});
