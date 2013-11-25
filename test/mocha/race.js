"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;



describe("Promise.race", function(){
    it("remains forever pending when passed an empty array", function (done) {
        var p = Promise.race([]);

        setTimeout(function() {
            assert(p.isPending());
            done();
        }, 100);
    });

    it("remains forever pending when passed an empty sparse array", function (done) {
        var p = Promise.race([,,,,,]);


        setTimeout(function() {
            assert(p.isPending());
            done();
        }, 100);
    });

    it("fulfills when passed an immediate value", function (done) {
        Promise.race([1,2,3]).then(function(v){
            assert.deepEqual(v, 1);
            done();
        });
    });

    it("fulfills when passed an immediately fulfilled value", function (done) {
        var d1 = Promise.pending();
        d1.fulfill(1);
        var p1 = d1.promise;

        var d2 = Promise.pending();
        d2.fulfill(2);
        var p2 = d2.promise;

        var d3 = Promise.pending();
        d3.fulfill(3);
        var p3 = d3.promise;

        Promise.race([p1, p2, p3]).then(function(v){
            assert.deepEqual(v, 1);
            done();
        });
    });

    it("fulfills when passed an eventually fulfilled value", function (done) {
        var d1 = Promise.pending();
        var p1 = d1.promise;

        var d2 = Promise.pending();
        var p2 = d2.promise;

        var d3 = Promise.pending();
        var p3 = d3.promise;

        Promise.race([p1, p2, p3]).then(function(v){
            assert.deepEqual(v, 1);
            done();
        });

        setTimeout(function(){
            d1.fulfill(1);
            d2.fulfill(2);
            d3.fulfill(3);
        }, 13);
    });

    it("rejects when passed an immediate value", function (done) {
        Promise.race([Promise.rejected(1), 2, 3]).then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    });

    it("rejects when passed an immediately rejected value", function (done) {
        var d1 = Promise.pending();
        d1.reject(1);
        var p1 = d1.promise;

        var d2 = Promise.pending();
        d2.fulfill(2);
        var p2 = d2.promise;

        var d3 = Promise.pending();
        d3.fulfill(3);
        var p3 = d3.promise;

        Promise.race([, p1, , p2, , ,  p3]).then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    });

    it("rejects when passed an eventually rejected value", function (done) {
        var d1 = Promise.pending();
        var p1 = d1.promise;

        var d2 = Promise.pending();
        var p2 = d2.promise;

        var d3 = Promise.pending();
        var p3 = d3.promise;

        Promise.race([p1, p2, p3]).then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        })

        setTimeout(function(){
            d1.reject(1);
            d2.fulfill(2);
            d3.fulfill(3);
        }, 13);
    });

    it( "propagates bound value", function(done) {
        var o = {};
        Promise.fulfilled([1]).bind(o).race().then(function(v){
            assert(v === 1);
            assert(this === o);
            done();
        });
    });
});
