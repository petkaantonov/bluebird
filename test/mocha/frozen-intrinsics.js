"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");

if (testUtils.isNodeJS) {
    var execFile = require("child_process").execFile;
    var path = require("path");

    function check(mode) {
        var assert = require("assert");
        if (mode === "frozen") Object.freeze(Error);
        if (mode === "sealed") Object.seal(Error);
        if (mode === "non-extensible") Object.preventExtensions(Error);
        if (mode === "readonly-limit") {
            Object.defineProperty(Error, "stackTraceLimit", {writable: false});
        }
        var limit = Error.stackTraceLimit;
        var Promise = require("./js/debug/bluebird.js");
        if (mode === "freeze-after-load") Object.freeze(Error);
        var Promise2 = Promise.getNewLibraryCopy();
        assert.strictEqual(Promise.OperationalError, Promise2.OperationalError);
        assert.strictEqual(Promise.TimeoutError, Promise2.TimeoutError);
        var sameModule = require("./js/debug/bluebird.js");
        assert.strictEqual(Promise, sameModule);
        var moduleRoot = require("path").resolve("js/debug") +
            require("path").sep;
        Object.keys(require.cache).forEach(function(key) {
            if (key.indexOf(moduleRoot) === 0) delete require.cache[key];
        });
        var Promise3 = require("./js/debug/bluebird.js");
        if (mode === "normal" || mode === "readonly-limit" ||
            mode === "freeze-after-load") {
            assert.strictEqual(Promise.CancellationError,
                Promise3.CancellationError);
            assert.strictEqual(Promise.OperationalError,
                Promise3.OperationalError);
            assert.strictEqual(Promise.TimeoutError, Promise3.TimeoutError);
            assert.strictEqual(Promise.AggregateError, Promise3.AggregateError);
        }
        if (mode === "frozen" || mode === "readonly-limit") {
            assert.strictEqual(Error.stackTraceLimit, limit);
        }
        Promise.config({cancellation: true, longStackTraces: true});
        var operational = new Promise.OperationalError("operation failed");
        // The instanceof check must work without relying on the marker.
        delete operational.isOperational;
        var ordinary = new Error("ordinary rejection");
        var foreign = new Promise3.OperationalError("another copy");
        return Promise.all([
            Promise.resolve(42).then(function(value) {
                assert.strictEqual(value, 42);
            }),
            Promise.reject(operational).error(function(error) {
                assert.strictEqual(error, operational);
            }),
            Promise.reject(foreign).error(function(error) {
                assert.strictEqual(error, foreign);
            }),
            Promise.reject(ordinary).error(assert.fail).catch(function(error) {
                assert.strictEqual(error, ordinary);
            }),
            Promise.fromCallback(function(callback) {
                callback(new Error("callback failed"));
            }).error(function(error) {
                assert(error instanceof Promise.OperationalError);
            }),
            Promise.delay(20).timeout(1).catch(Promise.TimeoutError,
                function(error) {
                    assert(error instanceof Promise.TimeoutError);
                }),
            Promise.resolve().then(function() {
                throw new Error("long trace");
            }).catch(function(error) {
                assert(/From previous event:/.test(error.stack));
            })
        ]).then(function() {
            console.log("ok");
        }, function(error) {
            console.error(error.stack);
            process.exit(1);
        });
    }

    describe("immutable Error constructor", function() {
        ["normal", "frozen", "sealed", "non-extensible",
            "readonly-limit", "freeze-after-load"].forEach(function(mode) {
            it("supports " + mode, function(done) {
                var code = "(" + check + ")(" + JSON.stringify(mode) + ");";
                execFile(process.execPath, ["-e", code], {
                    cwd: path.resolve(__dirname, "../..")
                }, function(error, stdout, stderr) {
                    if (error) return done(error);
                    try {
                        assert.strictEqual(stdout.trim(), "ok", stderr);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });
}
