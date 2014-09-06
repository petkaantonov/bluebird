"use strict";
var assert = require("assert");
var Promise= require("../../js/debug/bluebird.js");
var join = Promise.join;

function incrementer(value) {
    return value + 1;
}

describe("conditional fulfill handler", function() {
    specify("calls fullfill handler if condition is true", function(done) {
        Promise.resolve(0)
            .ifthen(true, incrementer)
            .then(function(result) {
                assert(result === 1);
                done();
            });
    });
    specify("ignores fullfill handler if condition is false", function(done) {
        Promise.resolve(0)
            .ifthen(false, incrementer)
            .then(function(result) {
                assert(result === 0);
                done();
            });
    });
});

describe("conditional rejection handler", function() {
    specify("calls rejection handler if condition is true", function(done) {
        Promise.reject(0)
            .ifthen(true, null, incrementer)
            .then(function(result) {
                assert(result === 1);
                done();
            });
    });
    specify("ignores rejection handler if condition is false", function(done) {
        Promise.reject(0)
            .ifthen(false, null, incrementer)
            .catch(function(result) {
                assert(result === 0);
                done();
            });
    });
});
