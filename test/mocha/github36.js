"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

describe("github36", function(){
    specify("should work", function(done){
        var called = 0;
        var donecalled = false;
        var _d = Promise.defer();

        _d.resolve()

        var f1 = function() {
            return _d.promise.then(function() {
                return true;
            })
        }

        var f2 = function() {
            var d1 = Promise.defer()

            setTimeout(function() {
                d1.resolve()
            }, 10)

            return d1.promise.then(function() {
                return _d.promise.then(function() {
                })
            });
        }

        var f3 = function() {
            called++;
            if(called > 15) {
                if (!donecalled) {
                    donecalled = true;
                    done();
                }
                return;
            }
            var promise = f1().then(function() {
                f2()
                    .then(function() {
                        f3()
                    })
            })

            promise.lastly(function() {
                setTimeout(function() {
                    f3()
                }, 10)
            })

        }

        f3();
    });
});

