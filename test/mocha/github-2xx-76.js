"use strict";


var Promise = require("../../js/debug/bluebird.js");
Promise.longStackTraces();
var assert = require("assert");

describe("github276 - stack trace cleaner", function(){
    specify("message with newline and a$_b should not be removed", function(done){
        Promise.resolve(1).then(function() {
            throw new Error("Blah\n          a$_b");
        }).catch(function(e) {
            var msg = e.stack.split('\n')[1]
            assert(msg.indexOf('a$_b') >= 0, 'message should contain a$_b');
        }).done(done, done);
    });
});

