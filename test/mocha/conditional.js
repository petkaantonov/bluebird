"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var failHandler = function failHandler() {
    throw new Error("Failed, unexpected value. ");
};

describe("thenIf", function () {
    specify("passes through truthy value", function () {
        return Promise.resolve("test").thenIf(function (x) {
            return x;
        }, function (x) {
            assert.equal(x, "test");
        });
    });

    specify("override falsey value", function () {
        return Promise.resolve(false).thenIf(function (x) {
            return x;
        }, failHandler, function (value) {
            assert.equal(value, false);
            return value;
        });
    });

    specify("passes through truthy value", function () {
        return Promise.resolve("test").thenIf(function (x) {
            return x;
        }).then(function (value) {
            assert.equal(value, "test");
        });
    });

    specify("override with truthy path", function () {
        return Promise.resolve(150).thenIf(function (x) {
            return x >= 100;
        }, function (value) {
            assert.equal(value, 150);
            return value * 2;
        }, failHandler).then(function (x) {
            return assert.equal(x, 300);
        });
    });

    specify("check Promise.thenIf utility method", function () {
        return Promise.resolve(150).then(Promise.thenIf(function (x) {
            return x >= 100;
        }, function (value) {
            assert.equal(value, 150);
            return value * 2;
        }, failHandler)).then(function (x) {
            return assert.equal(x, 300);
        });
    });

    specify("passes through value after returned promise is fulfilled", function () {
        var async = false;
        return Promise.resolve("test").thenIf(function (x) {
            return x === "test";
        }, function () {
            return new Promise(function (r) {
                setTimeout(function () {
                    async = true;
                    r(3);
                }, 1);
            });
        }).then(function (value) {
            assert(async);
            assert.equal(value, 3);
        });
    });

    specify("is not called on rejected promise", function () {
        var called = false;
        return Promise.reject("test").thenIf(function () {
            called = true;
        }).then(assert.fail, function (value) {
            assert(!called);
        });
    });

    specify("passes immediate rejection", function () {
        var err = new Error();
        return Promise.resolve("test").thenIf(function () {
            throw err;
        }).thenIf(assert.fail).then(assert.fail, function (e) {
            assert(err === e);
        });
    });

    specify("passes eventual rejection", function () {
        var err = new Error();
        return Promise.resolve("test").thenIf(function () {
            return new Promise(function (_, rej) {
                setTimeout(function () {
                    rej(err);
                }, 1);
            });
        }).thenIf(assert.fail).then(assert.fail, function (e) {
            assert(err === e);
        });
    });

    specify("passes value", function () {
        return Promise.resolve(123).thenIf(function (a) {
            assert(a === 123);
        });
    });
});