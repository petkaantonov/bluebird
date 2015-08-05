"use strict";

var assert = require("assert");

describe("Promise.lift", function() {

    it("should call function with resolved arguments", function() {
        var fn = function ( val1, val2 ){
            assert.equal(val1, "1");
            assert.equal(val2, "2");
        };

        var liftedFn = Promise.lift(fn);
        liftedFn("1", Promise.resolve("2"));
    });

});
