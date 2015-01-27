"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");



describe("Promise filter", function() {

    function ThrownError() {}


    var arr = [1,2,3];

    function assertArr(arr) {
        assert(arr.length === 2);
        assert(arr[0] === 1);
        assert(arr[1] === 3);
    }

    function assertErr(e) {
        assert(e instanceof ThrownError);
    }

    function assertFail() {
        assert.fail();
    }

    describe("should accept eventual booleans", function() {
        specify("immediately fulfilled", function() {
            return Promise.filter(arr, function(v) {
                return new Promise(function(r){
                    r(v !== 2);
                });
            }).then(assertArr);
        });

        specify("already fulfilled", function() {
            return Promise.filter(arr, function(v) {
                return Promise.resolve(v !== 2);
            }).then(assertArr);
        });

        specify("eventually fulfilled", function() {
            return Promise.filter(arr, function(v) {
                return new Promise(function(r){
                    setTimeout(function(){
                        r(v !== 2);
                    }, 1);
                });
            }).then(assertArr);
        });

        specify("immediately rejected", function() {
            return Promise.filter(arr, function(v) {
                return new Promise(function(v, r){
                    r(new ThrownError());
                });
            }).then(assertFail, assertErr);
        });
        specify("already rejected", function() {
            return Promise.filter(arr, function(v) {
                return Promise.reject(new ThrownError());
            }).then(assertFail, assertErr);
        });
        specify("eventually rejected", function() {
            return Promise.filter(arr, function(v) {
                return new Promise(function(v, r){
                    setTimeout(function(){
                        r(new ThrownError());
                    }, 1);
                });
            }).then(assertFail, assertErr);
        });


        specify("immediately fulfilled thenable", function() {
            return Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        f(v !== 2);
                    }
                };
            }).then(assertArr);
        });
        specify("eventually fulfilled thenable", function() {
            return Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        setTimeout(function(){
                            f(v !== 2);
                        }, 1);
                    }
                };
            }).then(assertArr);
        });

        specify("immediately rejected thenable", function() {
            return Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        r(new ThrownError());
                    }
                };
            }).then(assertFail, assertErr);
        });
        specify("eventually rejected thenable", function() {
            return Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        setTimeout(function(){
                            r(new ThrownError());
                        }, 1);
                    }
                };
            }).then(assertFail, assertErr);
        });

    });
});
