"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;


describe("Casted thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function(done) {
        var promise = Promise.cast(a);

        promise.then(function(v){
           assert(v === a);
           done();
        });
    });

    specify("rejects with itself", function(done) {
        var promise = Promise.cast(b);

        promise.caught(function(v){
           assert(v === b);
           done();
        });
    });
});

describe("Implicitly casted thenable", function() {

    var a = {
        then: function(fn){
            fn(a);
        }
    };

    var b = {
        then: function(f, fn){
            fn(b);
        }
    };

    specify("fulfills with itself", function(done) {
        Promise.fulfilled().then(function(){
            return a;
        }).then(function(v){
            assert(v === a);
            done();
        });
    });

    specify("rejects with itself", function(done) {
        Promise.fulfilled().then(function(){
            return b;
        }).caught(function(v){
            assert(v === b);
            done();
        });
    });
});