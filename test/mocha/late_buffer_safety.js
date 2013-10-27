"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
var isNodeJS = typeof process !== "undefined" &&
    typeof process.execPath === "string";

function async(cb){
    return Promise.fulfilled().nodeify(cb);
}


if( isNodeJS ) {
    describe("Late buffer", function(){

        specify("shouldn't stop at first error but continue consumption until everything is consumed", function(done){
            var originalException;
            while( originalException = process.listeners('uncaughtException').pop() ) {
                process.removeListener('uncaughtException', originalException);
            }

            var length = 10;
            var l = length;
            var a = 0;
            while(l--){
                async(function(){
                    throw (a++);
                });
            }
            var errs = [];
            process.on("uncaughtException", function(e){
                errs.push(e);
                if( errs.length === length ) {
                    var a = [];
                    for( var i = 0, len = length; i < len; ++i ) {
                        a[i] = i;
                    }
                    assert.deepEqual(a, errs);
                    done();
                }
            });
        });
    });
}