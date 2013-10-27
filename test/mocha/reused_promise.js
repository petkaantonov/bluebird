"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;



describe("If promise is reused to get at the value many times over the course of application", function() {
    var three = Promise.fulfilled(3);

    specify("It will not keep references to anything", function(done){
        var fn = function(){};
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);

        three.then(function(){
            for( var i = 0; i < three._length() - 5; ++i) {
                assert( three[i] === void 0 );
            }
            assert( three._promise0 === void 0 );
            assert( three._fulfill0 === void 0 );
            assert( three._reject0 === void 0 );
            assert( three._progress0 === void 0 );
            assert( three._receiver0 === void 0 );
            done();
        });
    });

    specify("It will be able to reuse the space", function(done) {
        var fn = function(){};
        var prom = three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);

        assert( three._promise0 === prom );
        assert( three._fulfill0 === fn );
        assert( three._reject0 === fn );
        assert( three._progress0 === fn );
        assert( three._receiver0 === void 0 );

        three.then(function(){
            setTimeout(function(){
                assert(three._length() === 0);
                done();
            }, 13);
        });
    });
});
