"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");
var isNodeJS = testUtils.isNodeJS;


if (isNodeJS) {
    describe("Late buffer", function() {
        specify("shouldn't stop at first error but continue consumption until everything is consumed", function(){
            var length = 10;
            var l = length;
            var a = 0;
            while (l--){
                Promise._async.throwLater(a++);
            }
            var errs = [];
            return testUtils.awaitGlobalException(function(e) {
                errs.push(e);
                if (errs.length === length) {
                    var a = [];
                    for (var i = 0, len = length; i < len; ++i) {
                        a[i] = i;
                    }
                    assert.deepEqual(a, errs);
                } else {
                    return false;
                }
            });
        });
    });
}
