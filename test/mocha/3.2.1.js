"use strict";

var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("3.2.1: Both `onFulfilled` and `onRejected` are optional arguments.", function () {
    describe("3.2.1.1: If `onFulfilled` is not a function, it must be ignored.", function () {
        function testNonFunction(nonFunction, stringRepresentation) {
            specify("`onFulfilled` is " + stringRepresentation, function (done) {
                rejected(dummy).then(nonFunction, function () {
                    done();
                });
            });
        }

        testNonFunction(undefined, "`undefined`");
        testNonFunction(null, "`null`");
        testNonFunction(false, "`false`");
        testNonFunction(5, "`5`");
        testNonFunction({}, "an object");
    });

    describe("3.2.1.2: If `onRejected` is not a function, it must be ignored.", function () {
        function testNonFunction(nonFunction, stringRepresentation) {
            specify("`onRejected` is " + stringRepresentation, function (done) {
                fulfilled(dummy).then(function () {
                    done();
                }, nonFunction);
            });
        }

        testNonFunction(undefined, "`undefined`");
        testNonFunction(null, "`null`");
        testNonFunction(false, "`false`");
        testNonFunction(5, "`5`");
        testNonFunction({}, "an object");
    });
});
