"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var testFulfilled = require("./helpers/testThreeCases").testFulfilled;
var testRejected = require("./helpers/testThreeCases").testRejected;

describe(".reflect()", function() {
    testFulfilled(1, function(promise) {
        return promise.reflect().then(function(inspection) {
            assert(inspection instanceof Promise.PromiseInspection);
            assert(inspection.isFulfilled());
            assert(inspection.value() === 1);
        });
    });
    testRejected(2, function(promise) {
        return promise.reflect().then(function(inspection) {
            assert(inspection instanceof Promise.PromiseInspection);
            assert(inspection.isRejected());
            assert(inspection.reason() === 2);
        });
    });
});
