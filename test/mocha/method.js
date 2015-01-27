"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


var obj = {};
var error = new Error();
var thrower = Promise.method(function() {
    throw error;
});;

var identity = Promise.method(function(val) {
    return val;
});

var array = Promise.method(function() {
    return [].slice.call(arguments);
});

var receiver = Promise.method(function() {
    return this;
});



describe("Promise.method", function(){
    specify("should reject when the function throws", function() {
        var async = false;
        var ret = thrower().then(assert.fail, function(e) {
            assert(async);
            assert(e === error);
        });
        async = true;
        return ret;
    });
    specify("should throw when the function is not a function", function() {
        try {
            Promise.method(null);
        }
        catch (e) {
            assert(e instanceof TypeError);
            return;
        }
        assert.fail();
    });
    specify("should call the function with the given receiver", function(){
        var async = false;
        var ret = receiver.call(obj).then(function(val) {
            assert(async);
            assert(val === obj);
        }, assert.fail);
        async = true;
        return ret;
    });
    specify("should call the function with the given value", function(){
        var async = false;
        var ret = identity(obj).then(function(val) {
            assert(async);
            assert(val === obj);
        }, assert.fail);
        async = true;
        return ret;
    });
    specify("should apply the function if given value is array", function(){
        var async = false;
        var ret = array(1, 2, 3).then(function(val) {
            assert(async);
            assert.deepEqual(val, [1,2,3]);
        }, assert.fail);
        async = true;
        return ret;
    });

    specify("should unwrap returned promise", function(){
        var d = Promise.defer();

        var ret = Promise.method(function(){
            return d.promise;
        })().then(function(v){
            assert(v === 3);
        })

        setTimeout(function(){
            d.fulfill(3);
        }, 1);
        return ret;
    });
    specify("should unwrap returned thenable", function(){

        return Promise.method(function(){
            return {
                then: function(f, v) {
                    f(3);
                }
            }
        })().then(function(v){
            assert(v === 3);
        });
    });

    specify("should unwrap a following promise", function() {
        var resolveF;
        var f = new Promise(function() {
            resolveF = arguments[0];
        });
        var v = new Promise(function(f) {
            setTimeout(function() {
                f(3);
            }, 1);
        });
        resolveF(v);
        return Promise.method(function(){
            return f;
        })().then(function(v){
            assert(v === 3);
        });
    });

    specify("zero arguments length should remain zero", function() {
        return Promise.method(function(){
            assert(arguments.length === 0);
        })();
    });
    specify("should retain binding from returned promise", function() {
        var THIS = {};
        return Promise.method(function() {
            return Promise.bind(THIS, 1);
        })().then(function(value) {
            assert.strictEqual(THIS, this);
            assert.strictEqual(1, value);
        });
    });
});
