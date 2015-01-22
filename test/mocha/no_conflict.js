var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.noConflict", function() {
    specify("should work", function() {
        var glob = typeof window !== "undefined" ? window : global;
        var bluebird = Promise.noConflict();
        assert(bluebird !== Promise);
        glob.Promise = null;
        assert.strictEqual(bluebird, bluebird.noConflict());
        try {
            delete glob.Promise;
            assert.strictEqual(bluebird, bluebird.noConflict());
        } catch (e) {
            assert.strictEqual(bluebird, bluebird.noConflict());
        }
        glob.Promise = bluebird;
        assert.strictEqual(bluebird, Promise.noConflict());
        glob.Promise = bluebird;
    })
});
