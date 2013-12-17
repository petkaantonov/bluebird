"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var obj = {};
var error = new Error();

var thrower = Promise.nodeMethod(function() {
    throw error;
});;

var identity = Promise.nodeMethod(function(val) {
    return val;
});

var array = Promise.nodeMethod(function() {
    return [].slice.call(arguments);
});

var receiver = Promise.nodeMethod(function() {
    return this;
});



describe("Promise.nodeMethod", function(){
    specify("should reject when the function throws", function(done) {
        var async = false;
        thrower(function(e) {
            assert(async);
            assert(e === error);
            done();
        });
        async = true;
    });
    specify("should throw when the function is not a function", function(done) {
        try {
            Promise.nodeMethod(null);
        }
        catch(e) {
            assert(e instanceof TypeError);
            done();
        }
    });
    specify("should call the function with the given receiver", function(done){
        var async = false;
        receiver.call(obj, function(e, val) {
            assert(async);
            assert(val === obj);
            done();
        }).catch(assert.fail);
        async = true;
    });
    specify("should call the function with the given value", function(done){
        var async = false;
        identity(obj, function(e, val) {
            assert(async);
            assert(val === obj);
            done();
        });
        async = true;
    });
    specify("should apply the function if given value is array", function(done){
        var async = false;
        array(1, 2, 3, function(e, val) {
            assert(async);
            assert.deepEqual(val, [1,2,3]);
            done();
        });
        async = true;
    });

    specify("should unwrap returned promise", function(done){
        var d = Promise.pending();

        Promise.nodeMethod(function(){
            return d.promise;
        })(function(e, v){
            assert(v === 3);
            done();
        })

        setTimeout(function(){
            d.fulfill(3);
        }, 13);
    });
    specify("should unwrap returned thenable", function(done){

        Promise.nodeMethod(function(){
            return {
                then: function(f, v) {
                    f(3);
                }
            }
        })(function(e, v){
            assert(v === 3);
            done();
        });
    });
});
