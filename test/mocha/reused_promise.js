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

        for (var i = 0; i < 1000; ++i) {
            if (!(i in three)) {
                break;
            }
        }
        len = i;
        assert(len > 0);


        setTimeout(function() {
            for (var i = 0; i < len; ++i) {
                assert((!(i in three)));
            }
            done();
        }, 13);
    });

    specify("It will be able to reuse the space", function(done) {
        var three = Promise.fulfilled(3);
        var fn = function(){};
        var prom = three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);
        three.then(fn, fn, fn);

        assert(three._promise0 === prom);
        assert(three._receiver0 === void 0);
        setTimeout(function() {
            assert(three._promise0 === void 0);
            assert(three._fulfillmentHandler0 === void 0);
            assert(three._rejectionHandler0 === void 0);
            assert(three._progressHandler0 === void 0);
            assert(three._receiver0 === void 0);
            var prom = three.then(fn, fn, fn);
            assert(three._promise0 === prom);
            assert(three._fulfillmentHandler0 === fn);
            assert(three._rejectionHandler0 === fn);
            assert(three._progressHandler0 === fn);
            assert(three._receiver0 === void 0);
            done();
        }, 13);
    });
});
