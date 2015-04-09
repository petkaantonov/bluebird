"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


function assertErrorHasLongTraces(e) {
    assert(e.stack.indexOf("From previous event:") > -1);
}

function testCollection(name, a1, a2, a3) {

    function getPromise(obj, val) {
        return obj === void 0
            ? Promise.resolve(val)[name](a1, a2, a3)
            : Promise[name](val, a1, a2, a3);
    }

    function thenable(obj) {
        var o = {
            then: function(f) {
                setTimeout(function(){
                    f(3);
                }, 1);
            }
        }
        specify("thenable for non-collection value", function() {
            return getPromise(obj, o)
                .then(assert.fail)
                .caught(Promise.TypeError, testUtils.returnToken)
                .then(testUtils.assertToken)
        });
    };

    function immediate(obj) {
        specify("immediate for non-collection value", function(){
            return getPromise(obj, 3)
                .then(assert.fail)
                .caught(Promise.TypeError, testUtils.returnToken)
                .then(testUtils.assertToken)
        });
    }

    function promise(obj) {
        var d = Promise.defer();
        setTimeout(function(){
            d.resolve(3);
        }, 1);
        specify("promise for non-collection value", function() {
            return getPromise(obj, d.promise)
                .then(assert.fail)
                .caught(Promise.TypeError, testUtils.returnToken)
                .then(testUtils.assertToken)
        });
    }

    describe("When passing non-collection argument to Promise."+name + "() it should reject", function() {
        immediate(Promise);
        thenable(Promise);
        promise(Promise);
    });

    describe("When calling ."+name + "() on a promise that resolves to a non-collection it should reject", function() {
        immediate();
        thenable();
        promise();
    });
}

if (Promise.hasLongStackTraces()) {


    describe("runtime API misuse should result in rejections", function(){
        specify("returning promises circularly", function() {
            var d = Promise.defer();
            var p = d.promise;

            var c = p.then(function(){
                return c;
            });
            d.fulfill(3);
            return c.then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });

        specify("using illegal catchfilter", function() {

            var d = Promise.defer();
            var p = d.promise;
            d.fulfill(3);
            return p.caught(null, function(){

            }).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });

        specify("non-function to map", function() {

            return Promise.map([], []).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });


        specify("non-function to map inside then", function() {

            return Promise.resolve().then(function(){
                return Promise.map([], []);
            }).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
                assertErrorHasLongTraces(e);
            });
        });


        specify("non-function to reduce", function() {

            return Promise.reduce([], []).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });


        specify("non-function to reduce inside then", function() {

            return Promise.resolve().then(function(){
                return Promise.reduce([], []);
            }).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
                assertErrorHasLongTraces(e);
            });
        });


        specify("non-integer to some", function() {

            return Promise.some([], "asd").then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });


        specify("non-integer to some inside then", function() {

            return Promise.resolve().then(function(){
                return Promise.some([], "asd")
            }).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
                assertErrorHasLongTraces(e);
            });
        });

        specify("non-array to all", function() {

            Promise.all(3, 3).then(assert.fail, function(e){
                assert(e instanceof Promise.TypeError);
            });
        });


        specify("non-array to all inside then", function() {

            return Promise.resolve().then(function(){
                return Promise.all(3, 3);
            }).then(assert.fail, function(e) {
                assert(e instanceof Promise.TypeError);
                assertErrorHasLongTraces(e);
            });
        });

    });


    describe("static API misuse should just throw right away", function(){

        specify("non-function to promise constructor", function() {
            try {
                new Promise();
                assert.fail();
            }
            catch (e) {
                assert(e instanceof Promise.TypeError);
            }
        });

        specify("non-function to coroutine", function() {
            try {
                Promise.coroutine();
                assert.fail();
            }
            catch (e) {
                assert(e instanceof Promise.TypeError);
            }
        });


        specify("non-object to promisifyAll", function() {
            try {
                Promise.promisifyAll();
                assert.fail();
            }
            catch (e) {
                assert(e instanceof Promise.TypeError);
            }
        });


        specify("non-function to promisify", function() {
            try {
                Promise.promisify();
                assert.fail();
            }
            catch (e) {
                assert(e instanceof Promise.TypeError);
            }
        });

    });

    testCollection("race");
    testCollection("all");
    testCollection("settle");
    testCollection("any");
    testCollection("some", 1);
    testCollection("map", function(){});
    testCollection("reduce", function(){});
    testCollection("filter", function(){});
    testCollection("props", function(){});
}
