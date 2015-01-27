"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


describe("github36", function(){
    specify("should work", function() {
        return new Promise(function(resolve, reject) {
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
                }, 1)

                return d1.promise.then(function() {
                    return _d.promise.then(function() {
                    })
                });
            }

            var f3 = function() {
                called++;
                if (called > 15) {
                    return resolve();
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
                    }, 1)
                })

            }

            f3();
        });
    });
});

