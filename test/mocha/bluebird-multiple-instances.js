"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var isNodeJS = testUtils.isNodeJS;
var OldPromise = require("./helpers/bluebird0_7_0.js");

if (isNodeJS) {
    var Promise1 = testUtils.addDeferred(require("../../js/debug/promise.js")());
    var Promise2 = testUtils.addDeferred(require("../../js/debug/promise.js")());

    var err1 = new Error();
    var err2 = new Error();

    describe("Separate instances of bluebird", function() {

        specify("Should have identical Error types", function() {
            assert(Promise1.CancellationError === Promise2.CancellationError);
            assert(Promise1.RejectionError === Promise2.RejectionError);
            assert(Promise1.TimeoutError === Promise2.TimeoutError);
        });

        specify("Should not be identical", function() {
            assert(Promise1.onPossiblyUnhandledRejection !==
                    Promise2.onPossiblyUnhandledRejection);
            assert(Promise1 !== Promise2);
        });

        specify("Should have different unhandled rejection handlers", function() {
            var spy1 = testUtils.getSpy();
            var spy2 = testUtils.getSpy();

            Promise1.onPossiblyUnhandledRejection(spy1(function(e, promise) {
                assert(promise instanceof Promise1);
                assert(!(promise instanceof Promise2));
                assert(e === err1);
            }));

            Promise2.onPossiblyUnhandledRejection(spy2(function(e, promise) {
                assert(promise instanceof Promise2);
                assert(!(promise instanceof Promise1));
                assert(e === err2);
            }));
            assert(Promise1.onPossiblyUnhandledRejection !==
                    Promise2.onPossiblyUnhandledRejection);

            var d1 = Promise1.defer();
            var d2 = Promise2.defer();

            d1.promise.then(function(){
                throw err1;
            });

            d2.promise.then(function(){
                throw err2;
            });

            setTimeout(function(){
                d1.fulfill();
                d2.fulfill();
                setTimeout(function() {
                    Promise1._unhandledRejectionCheck();
                    Promise2._unhandledRejectionCheck();
                }, 100);
            }, 1);
            return Promise.all([spy1.promise, spy2.promise]);
        });

        specify("Should use fast cast", function() {
            var a = Promise1.defer();
            var b = Promise2.cast(a.promise);
            assert(a.promise._receiver0 === b);
        });

        specify("Should use fast cast with very old version", function() {
            var a = OldPromise.pending();
            var b = Promise1.cast(a.promise);
            assert(a.promise._receiver0 === b);
        });

        specify("Should return 2 from very old promise", function() {
            return Promise1.resolve().then(
                function(){ return OldPromise.cast(0).then(function(){return 2});
            }).then(function(two){
                assert.equal(two, 2);
            });
        });

        specify("Should reject primitive from fast cast", function() {
            var a = OldPromise.pending();
            var b = Promise.resolve(a.promise);
            a.reject(1);
            return b.then(assert.fail, function(e) {
                assert.strictEqual(e, 1);
            });
        });
        specify("Should reject object from fast cast", function() {
            var err = new Error();
            var a = OldPromise.pending();
            var b = Promise.resolve(a.promise);
            a.reject(err);
            return b.then(assert.fail, function(e) {
                assert.strictEqual(e, err);
            });
        });
    });

}
