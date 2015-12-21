var assert = require("assert");

describe("promise lifecycle events subscriptions", function() {

    var numCreated = 0;
    var numChained = 0;
    var numFulfilled = 0;
    var numRejected = 0;

    beforeEach(function(){
        numCreated = 0;
        numChained = 0;
        numFulfilled = 0;
        numRejected = 0;
    });

    function testCreated(isSimpleAPI, onCreated) {
        Promise.on("created", onCreated, isSimpleAPI);
        var promise = new Promise(function(resolve){resolve()});
        assert(numCreated === 1);
        promise =  promise.then(function(){});
        assert(numCreated === 2);
        Promise.off("created", onCreated, isSimpleAPI);
        promise.then(function(){});
        assert(numCreated === 2);
    }

    function testChained(isSimpleAPI, onChained) {
        Promise.on("chained", onChained, isSimpleAPI);
        var promise = new Promise(function(resolve){resolve()});
        assert(numChained === 0);
        promise = promise.then(function(){})
        assert(numChained === 1);
        Promise.off("chained", onChained, isSimpleAPI);
        promise.then(function(){});
        assert(numChained === 1);
    }

    function testRejected(isSimpleAPI, onRejected) {
        Promise.on("rejected", onRejected, isSimpleAPI);
        assert(numRejected === 0);
        var promise = new Promise(function(resolve,reject){
            reject();
        });
        assert(numRejected === 1);
        promise = promise.caught(function(resolve,reject){
            assert(numRejected === 1);
            reject();
        });
        Promise.off("rejected", onRejected, isSimpleAPI);
        return promise.caught(function(){
            assert(numRejected === 1);
        });

    }

    function testFulfilled(isSimpleAPI, onFulfilled) {
        Promise.on("fulfilled", onFulfilled, isSimpleAPI);
        assert(numFulfilled === 0);
        var promise = new Promise(function(resolve){resolve()});
        assert(numFulfilled === 1);
        promise = promise.then(function(){});
        assert(numFulfilled === 1);
        Promise.off("fulfilled", onFulfilled, isSimpleAPI);
        promise.then(function(){});
        assert(numFulfilled === 1);
    }

    describe("simple events API", function() {
        it("created", function () {
            return testCreated( true, function () {
                assert(Promise.is(this));
                numCreated++
            });
        });
        it("chained", function () {
            return testChained( true, function (other) {
                assert(Promise.is(this));
                assert(Promise.is(other));
                numChained++;
            });
        });
        it("rejected", function () {
            return testRejected( true, function () {
                assert(Promise.is(this));
                numRejected++
            });
        });
        it("fulfilled", function () {
            return testFulfilled( true, function () {
                assert(Promise.is(this));
                numFulfilled++
            });
        });
    });

    describe("events API", function() {
        it("created", function () {
            return testCreated(false, function (event) {
                assert(event.eventName === "created");
                //assert(event.detail === null);
                assert(typeof event.timeStamp === "number");
                numCreated++;
            });
        });
        it("chained", function () {
            return testChained(false, function (event) {
                assert(event.eventName === "chained");
                assert(typeof event.timeStamp === "number");
                numChained++;
            });
        });
        it("rejected", function () {
            return testRejected(false, function () {
                numRejected++;
                assert(event.eventName === "rejected");
                assert(event.detail instanceof Error);
                assert(typeof event.timeStamp === "number");
            });
        });
        it("fulfilled", function () {
            return testFulfilled(false, function () {
                numFulfilled++;
                assert(event.eventName === "fulfilled");
                assert(!(event.detail instanceof Error));
                assert(typeof event.timeStamp === "number");
            });
        });
    });
});
