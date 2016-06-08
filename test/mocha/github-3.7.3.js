"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var Promise = adapter;

describe("github-373", function() {
    specify("unhandled unsuccessful Promise.join should result in correct error being reported", function() {
        var err = new Error("test");
        var rejected = Promise.delay(1).thenThrow(err);
        Promise.join(rejected, Promise.resolve(1), function(){});
        return testUtils.onUnhandledSucceed(err);
    });
});
