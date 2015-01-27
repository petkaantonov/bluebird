"use strict";


Promise.longStackTraces();
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var isNodeJS = testUtils.isNodeJS;


if (isNodeJS) {
    describe("github276 - stack trace cleaner", function(){
        specify("message with newline and a$_b should not be removed", function(){
            return Promise.resolve(1).then(function() {
                throw new Error("Blah\n          a$_b");
            }).then(assert.fail, function(e) {
                var msg = e.stack.split('\n')[1]
                assert(msg.indexOf('a$_b') >= 0, 'message should contain a$_b');
            });
        });
    });
}
