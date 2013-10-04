"use strict";

var assert = require("assert");

var adapter = require("../../js/bluebird_debug.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

describe("Async requirement", function() {

    var arr = [];

    function a() {
        arr.push(1);
    }

    function b() {
        arr.push(2);
    }

    function c() {
        arr.push(3);
    }


    function assertArr() {
        assert.deepEqual(arr, [1,2,3]);
        arr.length = 0;
    }


    specify("Basic", function(done) {
        var p = new Promise(function(resolve) {
            resolve();
        });
        a();
        p.then(c);
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Resolve-Before-Then", function(done) {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        resolveP();
        p.then(c);
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Resolve-After-Then", function(done) {
        var resolveP;
        var p = new Promise(function(resolve) {
            resolveP = resolve;
        });

        a();
        p.then(c);
        resolveP();
        b();
        p.then(assertArr).then(function(){
            done();
        }).done();
    });

    specify("Then-Inside-Then", function(done) {
        var fulfilledP = Promise.fulfilled();
        fulfilledP.then(function() {
            a();
            fulfilledP.then(c).then(assertArr).then(function(){
                done();
            }).done();
            b();
        });
    });
});