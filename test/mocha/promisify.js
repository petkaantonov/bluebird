"use strict";

var assert = require("assert");

var adapter = require("../../js/bluebird_debug.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var erroneusNode = function(a, b, c, cb) {
    setTimeout(function(){
        cb(sentinelError);
    }, 10);
};

var sentinel = {};
var sentinelError = new Error();

var successNode = function(a, b, c, cb) {
    setTimeout(function(){
        cb(null, sentinel);
    }, 10);
};

var successNodeMultipleValues = function(a, b, c, cb) {
    setTimeout(function(){
        cb(null, sentinel, sentinel, sentinel);
    }, 10);
};

var syncErroneusNode = function(a, b, c, cb) {
    cb(sentinelError);
};

var syncSuccessNode = function(a, b, c, cb) {
    cb(null, sentinel);
};

var syncSuccessNodeMultipleValues = function(a, b, c, cb) {
    cb(null, sentinel, sentinel, sentinel);
};


var error = Promise.promisify(erroneusNode);
var success = Promise.promisify(successNode);
var successMulti = Promise.promisify(successNodeMultipleValues);
var syncError = Promise.promisify(syncErroneusNode);
var syncSuccess = Promise.promisify(syncSuccessNode);
var syncSuccessMulti = Promise.promisify(syncSuccessNodeMultipleValues);

describe("when calling promisified function it should ", function(){


    specify("return a promise that is pending", function(done) {
        var a = error(1,2,3);
        var b = success(1,2,3);
        var c = successMulti(1,2,3);
        var d = syncError(1,2,3);
        var e = syncSuccess(1,2,3);
        var f = syncSuccessMulti(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 2 ) {
                done();
            }
        }

        assert.equal(a.isPending(), true);
        assert.equal(b.isPending(), true);
        assert.equal(c.isPending(), true);
        assert.equal(d.isPending(), true);
        assert.equal(e.isPending(), true);
        assert.equal(f.isPending(), true);
        a.catch(donecall);
        d.catch(donecall);
    });

    specify("call future attached handlers later", function(done) {
        var a = error(1,2,3);
        var b = success(1,2,3);
        var c = successMulti(1,2,3);
        var d = syncError(1,2,3);
        var e = syncSuccess(1,2,3);
        var f = syncSuccessMulti(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 6 ) {
                done();
            }
        }

        setTimeout(function(){
            a.then(assert.fail, donecall);
            b.then(donecall, assert.fail);
            c.then(donecall, assert.fail);
            d.then(assert.fail, donecall);
            e.then(donecall, assert.fail);
            f.then(donecall, assert.fail);
        }, 100);
    });

    specify("reject with the proper reason", function(done) {
        var a = error(1,2,3);
        var b = syncError(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 2 ) {
                done();
            }
        }

        a.catch(function(e){
            assert.equal( sentinelError, e);
            donecall();
        });
        b.catch(function(e){
            assert.equal( sentinelError, e);
            donecall();
        });
    });

    specify("fulfill with proper value(s)", function(done) {
        var a = success(1,2,3);
        var b = successMulti(1,2,3);
        var c = syncSuccess(1,2,3);
        var d = syncSuccessMulti(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 4 ) {
                done();
            }
        }

        a.then(function( val ){
            assert.equal(val, sentinel);
            donecall()
        });

        b.then(function( val ){
            assert.deepEqual( val, [sentinel, sentinel, sentinel] );
            donecall()
        });

        c.then(function( val ){
            assert.equal(val, sentinel);
            donecall()
        });

        d.then(function( val ){
            assert.deepEqual( val, [sentinel, sentinel, sentinel] );
            donecall()
        });
    });


});