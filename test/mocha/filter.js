"use strict";
    "use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var Promise = adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

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

    function cd(done) {
        return function() {
            done();
        };
    }

    describe("should accept eventual booleans", function() {
        specify("immediately fulfilled", function(done) {
            Promise.filter(arr, function(v) {
                return new Promise(function(r){
                    r(v !== 2);
                });
            }).then(assertArr).then(cd(done));
        });

        specify("already fulfilled", function(done) {
            Promise.filter(arr, function(v) {
                return Promise.resolve(v !== 2);
            }).then(assertArr).then(cd(done));
        });

        specify("eventually fulfilled", function(done) {
            Promise.filter(arr, function(v) {
                return new Promise(function(r){
                    setTimeout(function(){
                        r(v !== 2);
                    }, 13);
                });
            }).then(assertArr).then(cd(done));
        });

        specify("immediately rejected", function(done) {
            Promise.filter(arr, function(v) {
                return new Promise(function(v, r){
                    r(new ThrownError());
                });
            }).then(assertFail, assertErr).then(cd(done));
        });
        specify("already rejected", function(done) {
            Promise.filter(arr, function(v) {
                return Promise.reject(new ThrownError());
            }).then(assertFail, assertErr).then(cd(done));
        });
        specify("eventually rejected", function(done) {
            Promise.filter(arr, function(v) {
                return new Promise(function(v, r){
                    setTimeout(function(){
                        r(new ThrownError());
                    }, 13);
                });
            }).then(assertFail, assertErr).then(cd(done));
        });


        specify("immediately fulfilled thenable", function(done) {
            Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        f(v !== 2);
                    }
                };
            }).then(assertArr).then(cd(done));
        });
        specify("eventually fulfilled thenable", function(done) {
            Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        setTimeout(function(){
                            f(v !== 2);
                        }, 13);
                    }
                };
            }).then(assertArr).then(cd(done));
        });

        specify("immediately rejected thenable", function(done) {
            Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        r(new ThrownError());
                    }
                };
            }).then(assertFail, assertErr).then(cd(done));
        });
        specify("eventually rejected thenable", function(done) {
            Promise.filter(arr, function(v) {
                return {
                    then: function(f, r) {
                        setTimeout(function(){
                            r(new ThrownError());
                        }, 13);
                    }
                };
            }).then(assertFail, assertErr).then(cd(done));
        });

    });
});
