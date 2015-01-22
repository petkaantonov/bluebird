"use strict";


var Promise = adapter;
Promise.longStackTraces();
var assert = require("assert");
var isNodeJS = typeof process !== "undefined" &&
    typeof process.execPath === "string";

if (isNodeJS) {
    describe("github276 - stack trace cleaner", function(){
        specify("message with newline and a$_b should not be removed", function(done){
            Promise.resolve(1).then(function() {
                throw new Error("Blah\n          a$_b");
            }).caught(function(e) {
                var msg = e.stack.split('\n')[1]
                assert(msg.indexOf('a$_b') >= 0, 'message should contain a$_b');
            }).done(done, done);
        });
    });
}
