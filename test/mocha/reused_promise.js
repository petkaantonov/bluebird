"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;


describe("If promise is reused to get at the value many times over the course of application", function() {

    specify("Promise will clear handler data immediately", function(done) {
        var three = Promise.fulfilled(3);
        var fn = function(){};
        three.then(fn, fn, fn);
        assert(three._fulfillmentHandler0 === fn);
        assert(three._rejectionHandler0 === fn);
        assert(three._progressHandler0 === fn);

        setTimeout(function() {
            assert(three._fulfillmentHandler0 === void 0);
            assert(three._rejectionHandler0 === void 0);
            assert(three._progressHandler0 === void 0);
            assert(three._receiver0 === void 0);
            assert(three._promise0 === void 0);
            done();
        }, 13);
    });

    specify("It will not keep references to anything", function(done) {
        var three = Promise.fulfilled(3);
        var fn = function(){};
        var len;
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);

        len = three._length();
        assert(len > 0);

        setTimeout(function() {
            for (var i = 0; i < len; ++i) {
                assert(three[i] === undefined);
            }
            done();
        }, 13);
    });

    specify("It will prevent index inflation", function(done) {
        var three = Promise.fulfilled(3);
        var called = 0;
        function fn() {
            called++;
        }
        for (var i = 0; i < 512; ++i) {
            three.then(fn, fn, fn);
        }
        assert.equal(three._length(), 512);
        setTimeout(function () {
            function noop(){}
            assert.equal(called, 512);
            assert.equal(three._length(), 0);
            three.then(noop);
            assert.equal(three._fulfillmentHandler0, noop);
            done();
        }, 66);
    });
});
