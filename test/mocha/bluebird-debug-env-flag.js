
var Promise = require('../../js/bluebird');

var assert = require("assert");

describe("buebird-debug-env-flag", function() {

    it("should enable long stack traces", function(done) {
        Promise.fulfilled().then(function() {
            throw new Error("Oops");
        }).catch(function(err) {
            process.nextTick(function() {
                assert(err.stack.indexOf("From previous event") >= 0, 
                       "env flag should enable long stack traces");
                done();
            });
        });
    });
});
