"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

function get(arg) {
    return {
        then: function(ful, rej) {
            ful(arg)
        }
    }
}

function fail(arg) {
    return {
        then: function(ful, rej) {
            rej(arg)
        }
    };
}

function delay() {
    return new Promise(function(a){
        setTimeout(a, 15);
    });
}

var error = new Error("asd");

describe("yielding", function() {

    specify("non-promise should throw", function(done){

        Promise.spawn(function*(){

            var a = yield {};
            assert.fail();
            return 4;

        }).then(assert.fail).catch(function(e){
            assert( e instanceof TypeError );
            done();
        });
    });

    specify("non-promise should throw but be catchable", function(done){

        Promise.spawn(function*(){
            try {
                var a = yield {};
                assert.fail();
            }
            catch(e){
                assert( e instanceof TypeError );
                return 4;
            }

        }).then(function(val){
            assert.equal(val, 4);
            done();
        }).catch(assert.fail)
    });
});

describe("thenables", function(){

    specify("when they fulfill, the yielded value should be that fulfilled value", function(done){

        Promise.spawn(function*(){

            var a = yield get(3);
            assert.equal(a, 3);
            return 4;

        }).then(function(arg){
            assert.equal(arg, 4);
            done();
        });

    });


    specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(done){

        Promise.spawn(function*(){
            var a = yield fail(error);
            assert.fail();

        }).then(assert.fail).caught(function(e){
            assert.equal(e, error);
            done();
        });

    });

    specify("when they reject, and the generator has try.caught, it should continue working normally", function(done){

        Promise.spawn(function*(){
            try {
                var a = yield fail(error);
            }
            catch(e) {
                return e;
            }
            assert.fail();

        }).then(function(v){
            assert.equal(v, error);
            done();
        });

    });

    specify("when they fulfill but then throw, it should become rejection", function(done){

        Promise.spawn(function*(){
            var a = yield get(3);
            assert.equal(a, 3);
            throw error;
        }).then(assert.fail).caught(function(e){
            assert.equal(e, error);
            done();
        });
    });
});

describe("yield loop", function(){

    specify("should work", function(done){
        Promise.spawn(function* () {
            var a = [1,2,3,4,5];

            for( var i = 0, len = a.length; i < len; ++i ) {
                a[i] = yield get(a[i] * 2);
            }

            return a;
        }).then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

    specify("inside yield should work", function(done){
        Promise.spawn(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.all(a.map(function(v){
                return Promise.spawn(function *() {
                    return yield get(v*2);
                });
            }));
        }).then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

    specify("with simple map should work", function(done){
        Promise.spawn(function *() {
            var a = [1,2,3,4,5];

            return yield Promise.map(a, function(v){
                return Promise.cast(get(v*2));
            });
        }).then(function(arr){
            assert.deepEqual([2,4,6,8,10], arr);
            done();
        });
    });

});

describe("when using spawn as a method", function(){

    function MyClass() {
        this.goblins = 3;
    }
    MyClass.prototype.spawn = Promise.spawn;

    MyClass.prototype.spawnGoblins = function() {
        return this.spawn(function* () {
            this.goblins = yield get(this.goblins+1);
        });
    };

    specify("generator function's receiver should be the instance too", function( done ) {
        var a = new MyClass();
        var b = new MyClass();

        Promise.join(a.spawnGoblins().then(function(){
            return a.spawnGoblins()
        }), b.spawnGoblins()).then(function(){
            assert.equal(a.goblins, 5);
            assert.equal(b.goblins, 4);
            done();
        });

    });
});

describe("Promise.coroutine", function() {
    describe("thenables", function() {
        specify("when they fulfill, the yielded value should be that fulfilled value", function(done){

            Promise.coroutine(function*(){

                var a = yield get(3);
                assert.equal(a, 3);
                return 4;

            })().then(function(arg){
                assert.equal(arg, 4);
                done();
            });

        });


        specify("when they reject, and the generator doesn't have try.caught, it should immediately reject the promise", function(done){

            Promise.coroutine(function*(){
                var a = yield fail(error);
                assert.fail();

            })().then(assert.fail).caught(function(e){
                assert.equal(e, error);
                done();
            });

        });

        specify("when they reject, and the generator has try.caught, it should continue working normally", function(done){

            Promise.coroutine(function*(){
                try {
                    var a = yield fail(error);
                }
                catch(e) {
                    return e;
                }
                assert.fail();

            })().then(function(v){
                assert.equal(v, error);
                done();
            });

        });

        specify("when they fulfill but then throw, it should become rejection", function(done){

            Promise.coroutine(function*(){
                var a = yield get(3);
                assert.equal(a, 3);
                throw error;
            })().then(assert.fail).caught(function(e){
                assert.equal(e, error);
                done();
            });
        });
    });

    describe("yield loop", function(){

        specify("should work", function(done){
            Promise.coroutine(function* () {
                var a = [1,2,3,4,5];

                for( var i = 0, len = a.length; i < len; ++i ) {
                    a[i] = yield get(a[i] * 2);
                }

                return a;
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
            });
        });

        specify("inside yield should work", function(done){
            Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.all(a.map(function(v){
                    return Promise.coroutine(function *() {
                        return yield get(v*2);
                    })();
                }));
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
            });
        });

        specify("with simple map should work", function(done){
            Promise.coroutine(function *() {
                var a = [1,2,3,4,5];

                return yield Promise.map(a, function(v){
                    return Promise.cast(get(v*2));
                });
            })().then(function(arr){
                assert.deepEqual([2,4,6,8,10], arr);
                done();
            });
        });

    });

    describe("when using coroutine as a method", function(){

        function MyClass() {
            this.goblins = 3;
        }

        MyClass.prototype.spawnGoblins = Promise.coroutine(function* () {
            this.goblins = yield get(this.goblins+1);
        });


        specify("generator function's receiver should be the instance too", function( done ) {
            var a = new MyClass();
            var b = new MyClass();

            Promise.join(a.spawnGoblins().then(function(){
                return a.spawnGoblins()
            }), b.spawnGoblins()).then(function(){
                assert.equal(a.goblins, 5);
                assert.equal(b.goblins, 4);
                done();
            });

        });
    });
});