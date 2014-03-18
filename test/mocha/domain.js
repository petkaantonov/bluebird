"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
var isNodeJS = typeof process !== "undefined" &&
    typeof process.execPath === "string";


if (isNodeJS) {
    describe("domain", function(){
        specify("gh-148", function(done) {
            Promise.onPossiblyUnhandledRejection(function(error,promise) {
                throw error
            });
            var called = false;
            var e = new Error();
            Promise.resolve(23).then(function(){called = true});
            require('domain').create()
              .on('error', function(E) {
                assert.equal(e, E);
                assert(called);
                done();
              })
              .run(function() {
                  var P = new Promise(function(resolve,reject){ reject(e) });
              });

        });
    });
}
