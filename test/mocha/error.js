"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.prototype.error", function(){
    describe("catches stuff originating from explicit rejections", function() {
        specify("using callback", function() {
            var e = new Promise.TypeError("sup");
            function callsback(a, b, c, fn) {
                fn(e);
            }
            callsback = Promise.promisify(callsback);

            return callsback(1, 2, 3).error(function(err) {
                assert(err === e);
            });
        });
    });

    describe("does not catch stuff originating from thrown errors", function() {
        specify("using constructor", function() {
            var e = new Error("sup");
            return new Promise(function(resolve, reject) {
                throw e;
            }).error(function(err) {
                assert.fail();
            }).then(assert.fail, function(err){
                assert(err === e);
            });
        });
        specify("using thenable", function() {
            var e = new Error("sup");
            var thenable = {
                then: function(resolve, reject){
                    reject(e);
                }
            };
            return Promise.cast(thenable).error(function(err) {
                console.error(err);
                assert.fail();
            }).then(assert.fail, function(err) {
                assert(err === e);
            });
        });
        specify("using callback", function() {
            var e = new Error("sup");
            function callsback(a, b, c, fn) {
                throw e;
            }
            callsback = Promise.promisify(callsback);

            return callsback(1, 2, 3).error(function(err) {
                assert.fail();
            }).then(assert.fail, function(err){
                assert(err === e);
            });
        });
    });
})

if (testUtils.ecmaScript5) {
    describe("Weird errors", function() {
        specify("unwritable stack", function() {
            var e = new Error();
            var stack = e.stack;
            Object.defineProperty(e, "stack", {
                configurable: true,
                get: function() {return stack;},
                set: function() {throw new Error("cannot set");}
            });
            return new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(e);
                }, 1);
            }).caught(function(err) {
                assert.equal(e, err);
            });
        });
    });
}

describe("Error constructors", function() {
    describe("OperationalError", function() {
        it("should work without new", function() {
            var a = Promise.OperationalError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.OperationalError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should retain custom properties", function() {
            var message;
            var name;
            function f(cb) {
                var err = new Error("custom message");
                message = err.message;
                name = err.name;
                err.code = "ENOENT";
                err.path = "C:\\";
                cb(err);
            }
            return Promise.promisify(f)().error(function(e) {
                assert.strictEqual(e.message, message);
                assert.strictEqual(e.name, name);
                assert(e instanceof Promise.OperationalError);
                assert.strictEqual(e.code, "ENOENT");
                assert.strictEqual(e.path, "C:\\");
            });
        });
    });

    describe("CancellationError", function() {
        it("should work without new", function() {
            var a = Promise.CancellationError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.CancellationError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });
    });

    describe("TimeoutError", function() {
        it("should work without new", function() {
            var a = Promise.TimeoutError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.TimeoutError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });
    });

    describe("AggregateError", function() {
        it("should work without new", function() {
            var a = Promise.AggregateError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        it("should work with new", function() {
            var a = new Promise.AggregateError("msg");
            assert.strictEqual(a.message, "msg");
            assert(a instanceof Error);
        });

        if (testUtils.isNodeJS) {
            it("should stringify without circular errors", function() {
                var a = Promise.AggregateError();
                a.push(new Error("1"));
                a.push(new Error("2"));
                a.push(new Error("3"));
                a = a.toString();
                assert(a.indexOf("Error: 1") >= 0);
                assert(a.indexOf("Error: 2") >= 0);
                assert(a.indexOf("Error: 3") >= 0);
            });

            it("should stringify with circular errors", function() {
                var a = Promise.AggregateError();
                a.push(new Error("1"));
                a.push(a);
                a.push(new Error("3"));
                a = a.toString();
                assert(a.indexOf("Error: 1") >= 0);
                assert(a.indexOf("[Circular AggregateError]") >= 0);
                assert(a.indexOf("Error: 3") >= 0);
            });
        }
    });


});
