"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;
var OperationalError = Promise.OperationalError;

var erroneusNode = function(a, b, c, cb) {
    setTimeout(function(){
        cb(sentinelError);
    }, 10);
};

var sentinel = {};
var sentinelError = new OperationalError();

var successNode = function(a, b, c, cb) {
    setTimeout(function(){
        cb(null, sentinel);
    }, 10);
};

var successNodeMultipleValues = function(a, b, c, cb) {
    setTimeout(function(){
        cb(null, sentinel, sentinel, sentinel);
    }, 10);
};

var syncErroneusNode = function(a, b, c, cb) {
    cb(sentinelError);
};

var syncSuccessNode = function(a, b, c, cb) {
    cb(null, sentinel);
};

var syncSuccessNodeMultipleValues = function(a, b, c, cb) {
    cb(null, sentinel, sentinel, sentinel);
};

var errToThrow;
var thrower = Promise.promisify(function(a, b, c, cb) {
    errToThrow = new OperationalError();
    throw errToThrow;
});

var tprimitive = "Where is your stack now?";
var throwsStrings = Promise.promisify(function(cb){
    throw tprimitive;
});

var errbacksStrings = Promise.promisify(function(cb){
    cb( tprimitive );
});

var errbacksStringsAsync = Promise.promisify(function(cb){
    setTimeout(function(){
        cb( tprimitive );
    }, 13);
});

var error = Promise.promisify(erroneusNode);
var success = Promise.promisify(successNode);
var successMulti = Promise.promisify(successNodeMultipleValues);
var syncError = Promise.promisify(syncErroneusNode);
var syncSuccess = Promise.promisify(syncSuccessNode);
var syncSuccessMulti = Promise.promisify(syncSuccessNodeMultipleValues);

describe("when calling promisified function it should ", function(){


    specify("return a promise that is pending", function(done) {
        var a = error(1,2,3);
        var b = success(1,2,3);
        var c = successMulti(1,2,3);

        var calls = 0;
        function donecall() {
            if( (++calls) === 1 ) {
                done();
            }
        }

        assert.equal(a.isPending(), true);
        assert.equal(b.isPending(), true);
        assert.equal(c.isPending(), true);
        a.caught(donecall);
    });

    specify( "should use this if no receiver was given", function(done){
        var o = {};
        var fn = Promise.promisify(function(cb){

            cb(null, this === o);
        });

        o.fn = fn;

        o.fn().then(function(val){
            assert(val);
            done();
        });
    });

    specify("call future attached handlers later", function(done) {
        var a = error(1,2,3);
        var b = success(1,2,3);
        var c = successMulti(1,2,3);
        var d = syncError(1,2,3);
        var e = syncSuccess(1,2,3);
        var f = syncSuccessMulti(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 6 ) {
                done();
            }
        }

        a.caught(function(){})
        d.caught(function(){});

        setTimeout(function(){
            a.then(assert.fail, donecall);
            b.then(donecall, assert.fail);
            c.then(donecall, assert.fail);
            d.then(assert.fail, donecall);
            e.then(donecall, assert.fail);
            f.then(donecall, assert.fail);
        }, 100);
    });

    specify("Reject with the synchronously caught reason", function(done){
        thrower(1, 2, 3).then(assert.fail).caught(function(e){
            assert(e === errToThrow);
            done();
        });
    });

    specify("reject with the proper reason", function(done) {
        var a = error(1,2,3);
        var b = syncError(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 2 ) {
                done();
            }
        }

        a.caught(function(e){
            assert.equal( sentinelError, e);
            donecall();
        });
        b.caught(function(e){
            assert.equal( sentinelError, e);
            donecall();
        });
    });

    specify("fulfill with proper value(s)", function(done) {
        var a = success(1,2,3);
        var b = successMulti(1,2,3);
        var c = syncSuccess(1,2,3);
        var d = syncSuccessMulti(1,2,3);
        var calls = 0;
        function donecall() {
            if( (++calls) === 4 ) {
                done();
            }
        }

        a.then(function( val ){
            assert.equal(val, sentinel);
            donecall()
        });

        b.then(function( val ){
            assert.deepEqual( val, [sentinel, sentinel, sentinel] );
            donecall()
        });

        c.then(function( val ){
            assert.equal(val, sentinel);
            donecall()
        });

        d.then(function( val ){
            assert.deepEqual( val, [sentinel, sentinel, sentinel] );
            donecall()
        });
    });


});


describe("with more than 5 arguments", function(){

    var o = {
        value: 15,

        f: function(a,b,c,d,e,f,g, cb) {
            cb(null, [a,b,c,d,e,f,g, this.value])
        }

    }

    var prom = Promise.promisify(o.f, o);

    specify("receiver should still work", function(done) {
        prom(1,2,3,4,5,6,7).then(function(val){
            assert.deepEqual(
                val,
                [1,2,3,4,5,6,7, 15]
            );
            done();
        });

    });

});

describe("promisify on objects", function(){

    var o = {
        value: 15,

        f: function(a,b,c,d,e,f,g, cb) {
            cb(null, [a,b,c,d,e,f,g, this.value])
        }

    };

    var objf = function(){};

    objf.value = 15;
    objf.f = function(a,b,c,d,e,f,g, cb) {
        cb(null, [a,b,c,d,e,f,g, this.value])
    };

    function Test(data) {
        this.data = data;
    }

    Test.prototype.get = function(a, b, c, cb) {
        cb(null, a, b, c, this.data);
    };

    Test.prototype.getMany = function(a, b, c, d, e, f, g, cb) {
        cb(null, a, b, c, d, e, f, g, this.data);
    };

    Promise.promisifyAll(o);
    Promise.promisifyAll(objf);
    Promise.promisifyAll(Test.prototype);

    specify("should not repromisify", function() {
        var f = o.f;
        var fAsync = o.fAsync;
        var getOwnPropertyNames = Object.getOwnPropertyNames(o);
        var ret = Promise.promisifyAll(o);
        assert.equal(f, o.f);
        assert.equal(fAsync, o.fAsync);
        assert.deepEqual(getOwnPropertyNames, Object.getOwnPropertyNames(o));
        assert.equal(ret, o);
    });

    specify("should not repromisify function object", function() {
        var f = objf.f;
        var fAsync = objf.fAsync;
        var getOwnPropertyNames = Object.getOwnPropertyNames(objf);
        var ret = Promise.promisifyAll(objf);
        assert.equal(f, objf.f);
        assert.equal(fAsync, objf.fAsync);
        assert.deepEqual(getOwnPropertyNames, Object.getOwnPropertyNames(objf));
        assert.equal(ret, objf);
    });

    specify("should work on function objects too", function(done) {
        objf.fAsync(1, 2, 3, 4, 5, 6, 7).then(function(result){
            assert.deepEqual( result, [1, 2, 3, 4, 5, 6, 7, 15] );
            done();
        });
    });

    specify("should work on prototypes and not mix-up the instances", function(done) {
        var a = new Test(15);
        var b = new Test(30);
        var c = new Test(45);

        var calls = 0;

        function calldone() {
            calls++;
            if( calls === 3 ) {
                done();
            }
        }
        a.getAsync(1, 2, 3).then(function( result ){
            assert.deepEqual( result, [1, 2, 3, 15] );
            calldone();
        });

        b.getAsync(4, 5, 6).then(function( result ){
            assert.deepEqual( result, [4, 5, 6, 30] );
            calldone();
        });

        c.getAsync(7, 8, 9).then(function( result ){
            assert.deepEqual( result, [7, 8, 9, 45] );
            calldone();
        });
    });

    specify("should work on prototypes and not mix-up the instances with more than 5 arguments", function(done) {
        var a = new Test(15);
        var b = new Test(30);
        var c = new Test(45);

        var calls = 0;

        function calldone() {
            calls++;
            if( calls === 3 ) {
                done();
            }
        }
        a.getManyAsync(1, 2, 3, 4, 5, 6, 7).then(function( result ){
            assert.deepEqual( result, [1, 2, 3, 4, 5, 6, 7, 15] );
            calldone();
        });

        b.getManyAsync(4, 5, 6, 7, 8, 9, 10).then(function( result ){
            assert.deepEqual( result, [4, 5, 6, 7, 8, 9, 10, 30] );
            calldone();
        });

        c.getManyAsync(7, 8, 9, 10, 11, 12, 13).then(function( result ){
            assert.deepEqual( result, [7, 8, 9, 10, 11, 12, 13, 45] );
            calldone();
        });
    });

    specify( "Fails to promisify Async suffixed methods", function( done ) {
        var o = {
            x: function(cb){
                cb(null, 13);
            },
            xAsync: function(cb) {
                cb(null, 13);
            },

            xAsyncAsync: function( cb ) {
                cb(null, 13)
            }
        };
        try {
            Promise.promisifyAll(o);
        }
        catch (e) {
            assert(e instanceof Promise.TypeError);
            done();
        }
    });

    specify("Calls overridden methods", function(done) {
        function Model() {
            this.save = function() {
                done();
            };
        }
        Model.prototype.save = function() {
            throw new Error("");
        };

        Promise.promisifyAll(Model.prototype);
        var model = new Model();
        model.saveAsync();
    });
});

describe( "Promisify with custom suffix", function() {
    it("should define methods with the custom suffix", function(done) {
        function Test() {

        }

        Test.prototype.method = function method() {};

        Promise.promisifyAll(Test.prototype, {suffix: "$P"});
        assert(typeof Test.prototype.method$P == "function");
        done();
    });

    it("should throw on invalid suffix", function(done) {
        try {
            Promise.promisifyAll({}, {suffix: ""});
        }
        catch(e) {
            done();
        }
    });
})

describe("Module promisification", function() {
    it("should promisify module with direct property classes", function(done) {
        function RedisClient() {}
        RedisClient.prototype.query = function() {};
        function Multi() {}
        Multi.prototype.exec = function() {};
        Multi.staticMethod = function() {}

        var redis = {
            RedisClient: RedisClient,
            Multi: Multi,
            moduleMethod: function() {}
        };
        redis.Multi.staticMethod.tooDeep = function() {};

        Promise.promisifyAll(redis);

        assert(typeof redis.moduleMethodAsync === "function");
        assert(typeof redis.Multi.staticMethodAsync === "function");
        assert(typeof redis.Multi.prototype.execAsync === "function");
        assert(typeof redis.RedisClient.prototype.queryAsync === "function");
        assert(typeof redis.Multi.staticMethod.tooDeepAsync === "undefined");
        done();
    })

    it("should promisify module with inherited property classes", function(done) {
        function Mongoose() {}
        var Model = Mongoose.prototype.Model = function() {};
        Model.prototype.find = function() {};
        var Document = Mongoose.prototype.Document = function() {};
        Document.prototype.create = function() {};
        Document.staticMethod = function() {};
        var mongoose = new Mongoose();

        Promise.promisifyAll(mongoose);

        assert(typeof mongoose.Model.prototype.findAsync === "function");
        assert(typeof mongoose.Document.prototype.createAsync === "function");
        assert(typeof mongoose.Document.staticMethodAsync === "function")
        done();
    })
})

describe( "Promisify from prototype to object", function() {
    var getterCalled = 0;

    function makeClass() {
        var Test = (function() {

        function Test() {

        }
        var method = Test.prototype;

        method.test = function() {

        };

        method["---invalid---"] = function(){};

        if ((function(){"use strict"; return this === void 0})()) {
            Object.defineProperty(method, "thrower", {
                enumerable: true,
                configurable: true,
                get: function() {
                    throw new Error("getter called");
                },
                set: function() {
                    throw new Error("setter called");
                }
            });
            Object.defineProperty(method, "counter", {
                enumerable: true,
                configurable: true,
                get: function() {
                    getterCalled++;
                },
                set: function() {
                    throw new Error("setter called");
                }
            });
        }

        return Test;})();

        return Test;
    }

    specify( "Shouldn't touch the prototype when promisifying instance", function(done) {
        var Test = makeClass();

        var origKeys = Object.getOwnPropertyNames(Test.prototype).sort();
        var a = new Test();
        Promise.promisifyAll(a);

        assert( typeof a.testAsync === "function" );
        assert( a.hasOwnProperty("testAsync"));
        assert.deepEqual( Object.getOwnPropertyNames(Test.prototype).sort(), origKeys );
        assert(getterCalled === 0);
        done();
    });

    specify( "Shouldn't touch the method", function(done) {
        var Test = makeClass();

        var origKeys = Object.getOwnPropertyNames(Test.prototype.test).sort();
        var a = new Test();
        Promise.promisifyAll(a);


        assert( typeof a.testAsync === "function" );
        assert.deepEqual( Object.getOwnPropertyNames(Test.prototype.test).sort(), origKeys );
        assert( Promise.promisify( a.test ) !== a.testAsync );
        assert(getterCalled === 0);
        done();
    });

    specify( "Should promisify own method even if a promisified method of same name already exists somewhere in proto chain", function(done){
        var Test = makeClass();
        var instance = new Test();
        Promise.promisifyAll( instance );
        var origKeys = Object.getOwnPropertyNames(Test.prototype).sort();
        var origInstanceKeys = Object.getOwnPropertyNames(instance).sort();
        instance.test = function() {};
        Promise.promisifyAll( instance );
        assert.deepEqual( origKeys, Object.getOwnPropertyNames(Test.prototype).sort() );
        assert.notDeepEqual( origInstanceKeys,  Object.getOwnPropertyNames(instance).sort() );
        assert(getterCalled === 0);
        done();
    });

    specify( "Shouldn promisify the method closest to the object if method of same name already exists somewhere in proto chain", function(done){
        //IF the implementation is for-in, this pretty much tests spec compliance
        var Test = makeClass();
        var origKeys = Object.getOwnPropertyNames(Test.prototype).sort();
        var instance = new Test();
        instance.test = function() {

        };
        Promise.promisifyAll(instance);

        assert.deepEqual( Object.getOwnPropertyNames(Test.prototype).sort(), origKeys );
        assert(instance.test === instance.test);
        assert(getterCalled === 0);
        done();
    });

});


function assertLongStackTraces(e) {
    assert( e.stack.indexOf("From previous event:") > -1 );
}
if( Promise.hasLongStackTraces() ) {
    describe("Primitive errors wrapping", function() {
        specify("when the node function throws it", function(done){
            throwsStrings().caught(function(e){
                assert(e instanceof Error);
                assert(e.message == tprimitive);
                done();
            });
        });

        specify("when the node function throws it inside then", function(done){
            Promise.fulfilled().then(function() {
                throwsStrings().caught(function(e) {
                    assert(e instanceof Error);
                    assert(e.message == tprimitive);
                    assertLongStackTraces(e);
                    done();
                });
            });
        });


        specify("when the node function errbacks it synchronously", function(done){
            errbacksStrings().caught(function(e){
                assert(e instanceof Error);
                assert(e.message == tprimitive);
                done();
            });
        });

        specify("when the node function errbacks it synchronously inside then", function(done){
            Promise.fulfilled().then(function(){
                errbacksStrings().caught(function(e){
                    assert(e instanceof Error);
                    assert(e.message == tprimitive);
                    assertLongStackTraces(e);
                    done();
                });
            });
        });

        specify("when the node function errbacks it asynchronously", function(done){
            errbacksStringsAsync().caught(function(e){
                assert(e instanceof Error);
                assert(e.message == tprimitive);
                assertLongStackTraces(e);
                done();
            });
        });

        specify("when the node function errbacks it asynchronously inside then", function(done){
            Promise.fulfilled().then(function(){
                errbacksStringsAsync().caught(function(e){
                    assert(e instanceof Error);
                    assert(e.message == tprimitive);
                    assertLongStackTraces(e);
                    done();
                });
            });
        });
    });
}

describe("Custom promisifier", function() {
    var dummy = {};
    var err = new Error();
    var chrome = {
        getTab: function(tabId, callback) {
            setTimeout(function() {
                callback(dummy);
            }, 1);
        },
        getTabErroneous: function(tabId, callback, errback) {
            setTimeout(function() {
                errback(err);
            }, 1);
        }
    };

    Promise.promisifyAll(chrome, {
        promisifier: function(originalMethod) {
            return function() {
                var self = this;
                var args = [].slice.call(arguments);
                return new Promise(function(f, r) {
                    args.push(f, r);
                    originalMethod.apply(self, args);
                });
            };
        }
    });

    specify("getTab", function(done) {
        chrome.getTabAsync(1).then(function(result) {
            assert.equal(dummy, result);
            done();
        });
    });

    specify("getTabErroneous", function(done) {
        chrome.getTabErroneousAsync(2).caught(function(e) {
            assert.equal(e, err);
            done();
        });
    });



});

describe("OperationalError wrapping", function() {

    var CustomError = function(){

    }
    CustomError.prototype = new Error();
    CustomError.prototype.constructor = CustomError;

    function isUntypedError( obj ) {
        return obj instanceof Error &&
            Object.getPrototypeOf( obj ) === Error.prototype;
    }


    if(!isUntypedError(new Error())) {
        console.log("error must be untyped");
    }

    if(isUntypedError(new CustomError())) {
        console.log("customerror must be typed");
    }

    function stringback(cb) {
        cb("Primitive as error");
    }

    function errback(cb) {
        cb(new Error("error as error"));
    }

    function typeback(cb) {
        cb(new CustomError());
    }

    function stringthrow(cb) {
        throw("Primitive as error");
    }

    function errthrow(cb) {
        throw(new Error("error as error"));
    }

    function typethrow(cb) {
        throw(new CustomError());
    }

    stringback = Promise.promisify(stringback);
    errback = Promise.promisify(errback);
    typeback = Promise.promisify(typeback);
    stringthrow = Promise.promisify(stringthrow);
    errthrow = Promise.promisify(errthrow);
    typethrow = Promise.promisify(typethrow);

    specify("should wrap stringback", function(done) {
        stringback().error(function(e) {
            assert(e instanceof OperationalError);
            done();
        });
    });

    specify("should wrap errback", function(done) {
        errback().error(function(e) {
            assert(e instanceof OperationalError);
            done();
        });
    });

    specify("should not wrap typeback", function(done) {
        typeback().caught(CustomError, function(e){
                done();
            });
    });

    specify("should not wrap stringthrow", function(done) {
        stringthrow().error(assert.fail).caught(function(e){
            assert(e instanceof Error);
            done();
        });
    });

    specify("should not wrap errthrow", function(done) {
        errthrow().error(assert.fail).caught(function(e) {
            assert(e instanceof Error);
            done();
        });
    });

    specify("should not wrap typethrow", function(done) {
        typethrow().error(assert.fail)
            .caught(CustomError, function(e){
                done();
            });
    });
});

var global = new Function("return this")();
var canEvaluate = (function() {
    if (typeof window !== "undefined" && window !== null &&
        typeof window.document !== "undefined" &&
        typeof navigator !== "undefined" && navigator !== null &&
        typeof navigator.appName === "string" &&
        window === global) {
        return false;
    }
    return true;
})();
var canTestArity = (function(a, b, c) {}).length === 3 && canEvaluate;

if (canTestArity) {
    describe("arity", function() {
        specify("should be original - 1", function(done) {
            var fn = function(a, b, c, callback) {};

            assert.equal(Promise.promisify(fn).length, 3);

            var o = {
                fn: function(a, b, c, callback) {

                }
            };
            assert.equal(Promise.promisifyAll(o).fnAsync.length, 3);

            done();
        })
    })
}
