var assert = require("assert");
var util = require("../../js/debug/util");

describe("monitoring: promise lifecycle events subscriptions", function() {
    var numCreated = 0;
    var numChained = 0;
    var numFulfilled = 0;
    var numRejected = 0;
    var on = null;
    var off = null;

    before(function(){
        Promise.config({monitoring: true});
    });

    after(function(){
        Promise.config({monitoring: false});
    });

    beforeEach(function(){
        numCreated = 0;
        numChained = 0;
        numFulfilled = 0;
        numRejected = 0;
    });

    function nodeOn(eventName, eventHandler) {
        process.on.call(process, eventName, eventHandler);
    }
    function nodeOff(eventName, eventHandler) {
        process.removeListener.call(process, eventName, eventHandler);
    }
    function browserSimpleOn(eventName, eventHandler) {
        eventName = "on" + eventName.toLowerCase();
        self[eventName] = eventHandler;
    }
    function browserSimpleOff(eventName, eventHandler) {
        eventName = "on" + eventName.toLowerCase();
        assert(self[eventName] === eventHandler);
        delete self[eventName];
    }
    function browserDomOn (eventName, eventHandler) {
        self.addEventListener.call(self, eventName.toLowerCase(),
            eventHandler);
    }
    function browserDomOff (eventName, eventHandler) {
        self.removeEventListener.call(self, eventName.toLowerCase(),
            eventHandler);
    }

    function testCreated(onCreated) {
        on("promiseCreated", onCreated);
        var promise = new Promise(function(resolve){resolve()});
        assert(numCreated === 1);
        promise =  promise.then(function(){});
        assert(numCreated === 2);
        off("promiseCreated", onCreated);
        promise.then(function(){});
        assert(numCreated === 2);
    }

    function testChained(onChained) {
        on("promiseChained", onChained);
        var promise = new Promise(function(resolve){resolve()});
        assert(numChained === 0);
        promise = promise.then(function(){});
        assert(numChained === 1);
        off("promiseChained", onChained);
        promise.then(function(){});
        assert(numChained === 1);
    }

    function testRejected(onRejected) {
        on("promiseRejected", onRejected);
        assert(numRejected === 0);
        var promise = new Promise(function(resolve,reject){
            reject();
        });
        assert(numRejected === 1);
        promise = promise.caught(function(resolve,reject){
            assert(numRejected === 1);
            reject();
        });
        off("promiseRejected", onRejected);
        return promise.caught(function(){
            assert(numRejected === 1);
        });

    }

    function testFulfilled(onFulfilled) {
        on("promiseFulfilled", onFulfilled);
        assert(numFulfilled === 0);
        var promise = new Promise(function(resolve){resolve()});
        assert(numFulfilled === 1);
        promise = promise.then(function(){});
        assert(numFulfilled === 1);
        off("promiseFulfilled", onFulfilled);
        promise.then(function(){});
        assert(numFulfilled === 1);
    }

    describe("simple events API", function() {

        before(function() {
            if (util.isNode) {
                on = nodeOn;
                off = nodeOff;
            } else if (typeof self !== "undefined") {
                on = browserSimpleOn;
                off = browserSimpleOff;
            } else {
                assert(1===0);
            }
        });

        it("promiseCreated", function () {
            return testCreated(function (promise) {
                assert(Promise.is(promise));
                numCreated++
            });
        });
        it("promiseChained", function () {
            return testChained(function (promise, child) {
                assert(Promise.is(promise));
                assert(Promise.is(child));
                numChained++;
            });
        });
        it("promiseRejected", function () {
            return testRejected(function (promise) {
                assert(Promise.is(promise));
                numRejected++
            });
        });
        it("promiseFulfilled", function () {
            return testFulfilled(function (promise) {
                assert(Promise.is(promise));
                numFulfilled++
            });
        });
    });

    if (!util.isNode) {
        describe("events API", function() {

            before(function() {
                on = browserDomOn;
                off = browserDomOff;
            });

            it("promiseCreated", function () {
                return testCreated(function (event) {
                    assert(event.type === "promisecreated");
                    assert(Promise.is(event.detail.promise));
                    numCreated++;
                });
            });
            it("promiseChained", function () {
                return testChained(function (event) {
                    assert(event.type === "promisechained");
                    assert(Promise.is(event.detail.promise));
                    assert(Promise.is(event.detail.child));
                    numChained++;
                });
            });
            it("promiseRejected", function () {
                return testRejected(function (event) {
                    numRejected++;
                    assert(event.type === "promiserejected");
                    assert(Promise.is(event.detail.promise));
                });
            });
            it("promiseFulfilled", function () {
                return testFulfilled(function (event) {
                    numFulfilled++;
                    assert(event.type === "promisefulfilled");
                    assert(Promise.is(event.detail.promise));
                });
            });
        });
    }
});
