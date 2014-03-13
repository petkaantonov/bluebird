"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

function assertErrorHasLongTraces(e) {
    assert( e.stack.indexOf( "From previous event:" ) > -1 );
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
                }, 13);
            }
        }
        specify("thenable for non-collection value", function(done) {
            getPromise(obj, o).then(function(){
                assert.fail();
            }).caught(Promise.TypeError, function(e) {
                done();
            });
        });
    };

    function immediate(obj) {
        specify("immediate for non-collection value", function(done){
            getPromise(obj, 3).then(function(){
                assert.fail();
            }).caught(Promise.TypeError, function(e) {
                done();
            });
        });
    }

    function promise(obj) {
        var d = Promise.defer();
        setTimeout(function(){
            d.resolve(3);
        }, 13);
        specify("promise for non-collection value", function(done) {

            getPromise(obj, d.promise).then(function(){
                assert.fail();
            }).caught(Promise.TypeError, function(e) {
                done();
            });
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

if( Promise.hasLongStackTraces() ) {


    describe("runtime API misuse should result in rejections", function(){


        specify("returning promises circularly", function(done) {
            var d = Promise.pending();
            var p = d.promise;

            var c = p.then(function(){
                return c;
            });

            c.caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });
            d.fulfill(3);
        });

        specify("using illegal catchfilter", function(done) {

            var d = Promise.pending();
            var p = d.promise;

            p.caught(null, function(){

            })

            p.caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });

            d.fulfill(3);
        });

        specify( "non-function to map", function(done) {

            Promise.map([], []).caught(function(e){
                assert( e instanceof Promise.TypeError );
                done();
            });
        });


        specify( "non-function to map inside then", function(done) {

            Promise.fulfilled().then(function(){
                return Promise.map([], []);
            }).caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });
        });


        specify( "non-function to reduce", function(done) {

            Promise.reduce([], []).caught(function(e){
                assert( e instanceof Promise.TypeError );
                done();
            });
        });


        specify( "non-function to reduce inside then", function(done) {

            Promise.fulfilled().then(function(){
                return Promise.reduce([], []);
            }).caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });
        });


        specify( "non-integer to some", function(done) {

            Promise.some([], "asd").caught(function(e){
                assert( e instanceof Promise.TypeError );
                done();
            });
        });


        specify( "non-integer to some inside then", function(done) {

            Promise.fulfilled().then(function(){
                return Promise.some([], "asd")
            }).caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });
        });

        specify( "non-array to all", function(done) {

            Promise.all("asd", "asd").caught(function(e){
                assert( e instanceof Promise.TypeError );
                done();
            });
        });


        specify( "non-array to all inside then", function(done) {

            Promise.fulfilled().then(function(){
                return Promise.all("asd", "asd");
            }).caught(function(e){
                assert( e instanceof Promise.TypeError );
                assertErrorHasLongTraces(e);
                done();
            });
        });

    });


    describe("static API misuse should just throw right away", function(){

        specify("non-function to promise constructor", function(done) {
            try {
                new Promise();
                assert.fail();
            }
            catch(e) {
                assert(e instanceof Promise.TypeError);
                done();
            }
        });

        specify( "non-function to coroutine", function(done) {
            try {
                Promise.coroutine();
                assert.fail();
            }
            catch( e ) {
                assert( e instanceof Promise.TypeError );
                done();
            }
        });


        specify( "non-object to promisifyAll", function(done) {
            try {
                Promise.promisifyAll();
                assert.fail();
            }
            catch( e ) {
                assert( e instanceof Promise.TypeError );
                done();
            }
        });


        specify( "non-function to promisify", function(done) {
            try {
                Promise.promisify();
                assert.fail();
            }
            catch( e ) {
                assert( e instanceof Promise.TypeError );
                done();
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
