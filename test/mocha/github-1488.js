"use strict";

var assert = require("assert");

function stackHasPreviousEvent(stack) {
    return /From previous event/.test(stack);
}

if (Promise.hasLongStackTraces()) {
    describe("github 1488 - coroutine sync throw with long stack traces",
    function() {
        specify("should not add From previous event for a synchronous throw",
        function() {
            return Promise.coroutine(function* () {
                throw new Error("foo");
            })().then(assert.fail, function(e) {
                assert.strictEqual(e.message, "foo");
                assert(
                    !stackHasPreviousEvent(e.stack),
                    "sync throw should not include From previous event:\n" +
                        e.stack
                );
                assert(
                    e.stack.indexOf("github-1488") !== -1,
                    "stack should include the throw site:\n" + e.stack
                );
            });
        });

        specify("should keep the throw site on a synchronous throw",
        function() {
            return Promise.coroutine(function* throwSite1488() {
                throw new Error("foo");
            })().then(assert.fail, function(e) {
                assert(
                    /throwSite1488|github-1488/.test(e.stack),
                    "stack should include the generator throw site:\n" +
                        e.stack
                );
            });
        });

        specify("should keep From previous event after an async yield",
        function() {
            return Promise.coroutine(function* () {
                yield Promise.delay(1);
                throw new Error("foo");
            })().then(assert.fail, function(e) {
                assert(
                    stackHasPreviousEvent(e.stack),
                    "async throw should keep From previous event:\n" +
                        e.stack
                );
            });
        });

        specify("should keep caller context when started from a handler",
        function() {
            return Promise.resolve().then(function outer1488() {
                return Promise.coroutine(function* () {
                    throw new Error("foo");
                })();
            }).then(assert.fail, function(e) {
                assert(
                    stackHasPreviousEvent(e.stack),
                    "handler-started coroutine should keep " +
                        "From previous event:\n" + e.stack
                );
            });
        });
    });
}
