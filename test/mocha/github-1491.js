"use strict";
var assert = require("assert");
var EventEmitter = require("events").EventEmitter;
var testUtils = require("./helpers/util.js");

function pendingFulfill(value) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(value);
        }, 1);
    });
}

function isForgottenReturn(warning) {
    var msg = warning && warning.message;
    return typeof msg === "string" &&
        msg.indexOf("not returned from it") !== -1;
}

function withForgottenReturnCapture(fn) {
    var warnings = [];
    function onWarning(warning) {
        if (isForgottenReturn(warning)) {
            warnings.push(warning);
        }
    }
    process.on("warning", onWarning);
    Promise.config({warnings: true});
    return Promise.try(fn).then(function() {
        return warnings;
    }).lastly(function() {
        process.removeListener("warning", onWarning);
        Promise.config({warnings: false});
    });
}

describe("github-1491", function() {
    specify(
        "chain ending in .done() is not a runaway promise",
        function() {
            return withForgottenReturnCapture(function() {
                return Promise.resolve().then(function() {
                    pendingFulfill(1).then(function() {
                        return 42;
                    }).done();
                }).then(function() {});
            }).then(function(warnings) {
                assert.strictEqual(warnings.length, 0);
            });
        }
    );

    specify(
        "true runaway promise is still reported",
        function() {
            return withForgottenReturnCapture(function() {
                return Promise.resolve().then(function() {
                    pendingFulfill(1).then(function() {
                        return 42;
                    });
                }).then(function() {});
            }).then(function(warnings) {
                assert.ok(warnings.length > 0);
            });
        }
    );

    specify(
        "all branches ending in .done() are not runaway",
        function() {
            return withForgottenReturnCapture(function() {
                return Promise.resolve().then(function() {
                    var p = pendingFulfill(1);
                    p.then(function() { return 1; }).done();
                    p.then(function() { return 2; }).done();
                }).then(function() {});
            }).then(function(warnings) {
                assert.strictEqual(warnings.length, 0);
            });
        }
    );

    specify(
        "mixed branches still warn when one is not .done()",
        function() {
            return withForgottenReturnCapture(function() {
                return Promise.resolve().then(function() {
                    var p = pendingFulfill(1);
                    p.then(function() { return 1; }).done();
                    p.then(function() { return 2; });
                }).then(function() {});
            }).then(function(warnings) {
                assert.ok(warnings.length > 0);
            });
        }
    );

    specify(
        "library callback API using .done() is not runaway",
        function() {
            function createMyEmitterApi() {
                var emitter = new EventEmitter();
                var connectPromise = pendingFulfill().then(function() {
                    return 42;
                });
                connectPromise.done(function() {
                    emitter.emit("connect");
                }, function(err) {
                    emitter.emit("error", err);
                });
                emitter.close = function() {
                    connectPromise.then(function() {
                        return pendingFulfill();
                    }).done(function() {
                        emitter.emit("close");
                    }, function(err) {
                        emitter.emit("error", err);
                    });
                };
                return emitter;
            }

            return withForgottenReturnCapture(function() {
                var consumer = new Promise(function(resolve, reject) {
                    var api = createMyEmitterApi();
                    api.once("connect", function() {
                        resolve(api);
                    });
                    api.once("error", reject);
                });
                return consumer.then(function(api) {
                    api.close();
                }).then(function() {});
            }).then(function(warnings) {
                assert.strictEqual(warnings.length, 0);
            });
        }
    );

    if (testUtils.isNodeJS) {
        specify(
            "rejected .done() is fatal, not an unhandled rejection",
            function() {
                var unhandled = 0;
                Promise.onPossiblyUnhandledRejection(function() {
                    unhandled++;
                });
                var returnValue = Promise.reject(
                    new Error("safe_error")
                ).done();
                return testUtils.awaitProcessExit(function() {
                    assert.strictEqual(returnValue, undefined);
                    assert.strictEqual(unhandled, 0);
                }).lastly(function() {
                    Promise.onPossiblyUnhandledRejection(null);
                });
            }
        );
    }
});
