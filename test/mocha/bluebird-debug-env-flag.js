
var Promise = require('../../js/main/bluebird.js');

var assert = require("assert");

var isNodeJS = typeof process !== "undefined" && process !== null &&
    typeof process.execPath === "string";

if( isNodeJS ) {
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
}
