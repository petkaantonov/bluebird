"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

if (testUtils.isNodeJS) {
    describe("multiple copies", function() {
        specify("are being loaded", function() {
            var a = require("../../js/debug/bluebird.js");
            Object.keys(require.cache).forEach(function(key) {
                if (/debug/.test(key))
                    delete require.cache[key];
            });
            var b = require("../../js/debug/bluebird.js");
            assert.notEqual(a, b);
        });
    });
}
