"use strict";

var assert = require("assert");
var Promise = require("../../js/debug/bluebird.js");

describe("github-373", function() {
    specify("unhandled unsuccessful Promise.join should result in correct error being reported", function(done) {
        var err = new Error("test");
        var rejected = Promise.delay(30).thenThrow(err);
        Promise.onPossiblyUnhandledRejection(function(error) {
            Promise.onPossiblyUnhandledRejection(null);
            assert(err === error);
            done();
        });
        Promise.join(rejected, Promise.resolve(1), function(){});
    });
});
