"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");



describe("If promise is reused to get at the value many times over the course of application", function() {

    specify("Promise will clear handler data immediately", function() {
        var three = Promise.resolve(3);
        var fn = function(){};
        three.then(fn, fn);
        assert(three._fulfillmentHandler0 === fn);
        assert(three._rejectionHandler0 === fn);

        return Promise.delay(1).then(function() {
            assert(three._fulfillmentHandler0 === void 0);
            assert(three._rejectionHandler0 === void 0);
            assert(three._receiver0 === void 0);
            assert(three._promise0 === void 0);
        });
    });

    specify("It will not keep references to anything", function() {
        var three = Promise.resolve(3);
        var fn = function(){};
        var len;
        three.then(fn, fn);
        three.then(fn, fn);
        three.then(fn, fn);
        three.then(fn, fn);
        three.then(fn, fn);

        len = three._length();
        assert(len > 0);

        return Promise.delay(1).then(function() {
            for (var i = 0; i < len; ++i) {
                assert(three[i] === undefined);
            }
        });
    });

    specify.skip("It will prevent index inflation", function() {
        var three = Promise.resolve(3);
        var called = 0;
        function fn() {
            called++;
        }
        for (var i = 0; i < 512; ++i) {
            three.then(fn, fn, fn);
        }
        assert.equal(three._length(), 512);
        return Promise.delay(1).then(function() {
            function noop(){}
            assert.equal(called, 512);
            assert.equal(three._length(), 0);
            three.then(noop);
            assert.equal(three._fulfillmentHandler0, noop);
        });
    });
});
