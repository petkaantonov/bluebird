/*jshint strict: false */

var assert = require("assert");

var adapter = global.adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

var undefinedThisStrict = (function() {
    "use strict";
    return this;
})();

var undefinedThisSloppy = (function() {
    return this;
})();

describe("2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value).", function () {
    describe("strict mode", function () {
        specify("fulfilled", function (done) {
            fulfilled(dummy).then(function onFulfilled() {
                "use strict";

                assert(this === undefinedThisStrict ||
                       this === undefinedThisSloppy);
                done();
            });
        });

        specify("rejected", function (done) {
            rejected(dummy).then(null, function onRejected() {
                "use strict";

                assert(this === undefinedThisStrict ||
                       this === undefinedThisSloppy);
                done();
            });
        });
    });

    describe("sloppy mode", function () {
        specify("fulfilled", function (done) {
            fulfilled(dummy).then(function onFulfilled() {
                assert.strictEqual(this, undefinedThisSloppy);
                done();
            });
        });

        specify("rejected", function (done) {
            rejected(dummy).then(null, function onRejected() {
                assert.strictEqual(this, undefinedThisSloppy);
                done();
            });
        });
    });
});
