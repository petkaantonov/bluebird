"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

var CustomError = function(){};

CustomError.prototype = new Error();

var predicateFilter = function(e) {
    return (/invalid/).test(e.message);
}

function BadError(msg) {
    this.message = msg;
    return this;
}

function predicatesUndefined(e) {
    return e === void 0;
}

function predicatesPrimitiveString(e) {
    return /^asd$/.test(e);
}

var token = {};
var returnToken = function() {
    return token;
};

var assertToken = function(val) {
    assert.strictEqual(token, val);
};

describe("A promise handler that throws a TypeError must be caught", function() {

    specify("in a middle.caught filter", function() {
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            a.b.c.d()
        }).then(assert.fail).caught(SyntaxError, function(e){
            assert.fail();
        }).caught(Promise.TypeError, returnToken)
        .then(assertToken);
    });


    specify("in a generic.caught filter that comes first", function() {
        var a = Promise.defer();

        a.fulfill(3);
        return a.promise.then(function(){
            a.b.c.d()
        }).then(assert.fail, returnToken).caught(SyntaxError, function(e){
            assert.fail();
        }).caught(Promise.TypeError, function(e){
            assert.fail();
        }).then(assertToken);

    });

    specify("in an explicitly generic.caught filter that comes first", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            a.b.c.d()
        })
        .then(assert.fail)
        .caught(Error, returnToken)
        .caught(SyntaxError, assert.fail)
        .caught(Promise.TypeError, assert.fail)
        .then(assertToken);
    });

    specify("in a specific handler after thrown in generic", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            a.b.c.d()
        }).then(assert.fail, function(e){
            throw e
        }).caught(SyntaxError, assert.fail)
        .then(assert.fail)
        .caught(Promise.TypeError, returnToken)
        .then(assertToken);


    });


    specify("in a multi-filter handler", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            a.b.c.d()
        })
        .then(assert.fail)
        .caught(SyntaxError, TypeError, returnToken)
        .then(assertToken);
    });


    specify("in a specific handler after non-matching multi.caught handler", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            a.b.c.d()
        })
        .then(assert.fail)
        .caught(SyntaxError, CustomError, assert.fail)
        .caught(Promise.TypeError, returnToken)
        .then(assertToken)
    });

});


describe("A promise handler that throws a custom error", function() {

    specify("Is filtered if inheritance was done even remotely properly", function() {
        var a = Promise.defer();
        var b = new CustomError();
        a.fulfill(3);
        return a.promise.then(function(){
            throw b;
        })
        .then(assert.fail)
        .caught(SyntaxError, assert.fail)
        .caught(Promise.TypeError, assert.fail)
        .caught(CustomError, function(e){
            assert.equal(e, b);
            return token;
        })
        .then(assertToken);


    });

    specify("Is filtered along with built-in errors", function() {
        var a = Promise.defer();
        var b = new CustomError();
        a.fulfill(3);
        return a.promise.then(function(){
            throw b;
        })
        .then(assert.fail)
        .caught(Promise.TypeError, SyntaxError, CustomError, returnToken)
        .caught(assert.fail)
        .then(assertToken)
    });

    specify("Throws after matched type handler throws", function() {
        var err = new Promise.TypeError();
        var err2 = new Error();
        return Promise.reject(err).caught(Promise.TypeError, function() {
            throw err2;
        }).then(assert.fail, function(e) {
            assert.strictEqual(err2, e);
        });
    });
});

describe("A promise handler that throws a CustomError must be caught", function() {
    specify("in a middle.caught filter", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        })
        .caught(SyntaxError, assert.fail)
        .caught(CustomError, returnToken)
        .then(assertToken);
    });


    specify("in a generic.caught filter that comes first", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        }).then(assert.fail, returnToken)
        .caught(SyntaxError, assert.fail)
        .caught(CustomError, assert.fail)
        .then(assertToken)
    });

    specify("in an explicitly generic.caught filter that comes first", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        })
        .caught(Error, returnToken)
        .caught(SyntaxError, assert.fail)
        .caught(CustomError, assert.fail)
        .then(assertToken);
    });

    specify("in a specific handler after thrown in generic", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        }).then(assert.fail, function(e){
            throw e
        })
        .caught(SyntaxError, assert.fail)
        .caught(CustomError, returnToken)
        .then(assertToken);

    });


    specify("in a multi-filter handler", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        })
        .caught(SyntaxError, CustomError, returnToken)
        .then(assertToken)

    });


    specify("in a specific handler after non-matching multi.caught handler", function() {
        var a = Promise.defer();
        a.fulfill(3);

        return a.promise.then(function(){
            throw new CustomError()
        })
        .caught(SyntaxError, TypeError, assert.fail)
        .caught(CustomError, returnToken)
        .then(assertToken);
    });

});

describe("A promise handler that is caught in a filter", function() {

    specify("is continued normally after returning a promise in filter", function() {
         var a = Promise.defer();
         var c = Promise.defer();
         var b = new CustomError();
         a.fulfill(3);
         setTimeout(function(){
             c.fulfill(3);
         }, 1);
         return a.promise.then(function(){
             throw b;
         }).caught(SyntaxError, function(e){
            assert.fail();
         }).caught(Promise.TypeError, function(e){
            assert.fail();
         }).caught(CustomError, function(e){
            assert.equal(e, b);
            return c.promise.thenReturn(token);
         }).then(assertToken, assert.fail, assert.fail);
    });

    specify("is continued normally after returning a promise in original handler", function() {
         var a = Promise.defer();
         var c = Promise.defer();
         a.fulfill(3);
         setTimeout(function(){
             c.fulfill(3);
         }, 1);
        return a.promise.then(function(){
             return c.promise;
         }).caught(SyntaxError, function(e){
            assert.fail();
         }).caught(Promise.TypeError, function(e){
            assert.fail();
         }).caught(CustomError, function(e){
            assert.fail();
         });

    });

    specify("should throw type error for not passing function", function() {
        try {
            var a = Promise.reject(new Error("asd"));
            a.caught(Promise.TypeError, "string");
            throw new Error("fail");
        } catch (e) {
            if (e instanceof Promise.TypeError) {
                return true;
            } else {
                throw new Error("fail");
            }
        }
    });
});

describe("A promise handler with a predicate filter", function() {

    specify("will catch a thrown thing matching the filter", function() {
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw new Error("horrible invalid error string");
        }).caught(predicateFilter, returnToken)
        .then(assertToken);

    });
    specify("will NOT catch a thrown thing not matching the filter", function() {
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw new Error("horrible valid error string");
        }).caught(predicateFilter, function(e){
            assert.fail();
        }).then(assert.fail, function(){})
    });

    specify("will assert.fail when a predicate is a bad error class", function() {
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw new Error("horrible custom error");
        }).caught(BadError, function(e){
            assert.fail();
        }).then(assert.fail, returnToken)
        .then(assertToken);

    });

    specify("will catch a thrown undefiend", function(){
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw void 0;
        }).caught(function(e) { return false }, function(e){
            assert.fail();
        }).caught(predicatesUndefined, returnToken)
        .then(assertToken);

    });

    specify("will catch a thrown string", function(){
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw "asd";
        }).caught(function(e) { return false }, function(e){
            assert.fail();
        }).caught(predicatesPrimitiveString, returnToken)
        .then(assertToken);

    });

    specify("will assert.fail when a predicate throws", function() {
        var a = Promise.defer();
        a.fulfill(3);
        return a.promise.then(function(){
            throw new CustomError("error happens");
        }).then(assert.fail, function(e) { return e.f.g; }, function(e){
            assert.fail();
        }).caught(TypeError, returnToken)
        .then(assertToken);
    });
});

describe("object property predicates", function() {
    specify("matches 1 property loosely", function() {
        var e = new Error();
        e.code = "3";
        return Promise.resolve()
            .then(function() {
                throw e;
            })
            .caught({code: 3}, function(err) {
                assert.equal(e, err);
            });
    });

    specify("matches 2 properties loosely", function() {
        var e = new Error();
        e.code = "3";
        e.code2 = "3";
        return Promise.resolve()
            .then(function() {
                throw e;
            })
            .caught({code: 3, code2: 3}, function(err) {
                assert.equal(e, err);
            });
    });

    specify("doesn't match inequal properties", function() {
        var e = new Error();
        e.code = "3";
        e.code2 = "4";
        return Promise.resolve()
            .then(function() {
                throw e;
            })
            .caught({code: 3, code2: 3}, function(err) {
                assert.fail();
            })
            .caught(function(v) {return v === e}, function() {});
    });

    specify("doesn't match primitives even if the property matches", function() {
        var e = "string";
        var length = e.length;
        return Promise.resolve()
            .then(function() {
                throw e;
            })
            .caught({length: length}, function(err) {
                assert.fail();
            })
            .caught(function(v) {return typeof v === "string"}, function(err) {
                assert.equal(e, err);
            });
    });
});

