"use strict";

var assert = require("assert");

var getContextFn = Promise._getContext;
Promise.config({ asyncHooks: true });
var supportsAsync = Promise._getContext !== getContextFn;
Promise.config({ asyncHooks: false });
if (supportsAsync) {
    runTests();
}

function runTests() {
    var async_hooks = require('async_hooks');

    var tree = new Set();
    var hook = async_hooks.createHook({
        init: function(asyncId, type, triggerId) {
            if (tree.has(triggerId)) {
                tree.add(asyncId);
            }
        }
    });

    var currentId = async_hooks.executionAsyncId;

    function getAsyncPromise() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                setTimeout(resolve, 1);
            }, 1);
        });
    }

    describe("async_hooks", function() {
        beforeEach(function() {
            Promise.config({ asyncHooks: true });
        })
        afterEach(function()  {
            tree.clear();
            hook.disable();
            Promise.config({ asyncHooks: false });
        });

        it('should preserve async context when using fromNode', function() {
            hook.enable()
            tree.add(currentId());

            return new Promise(function(resolve) {
                var globalResolve;
                setImmediate(function() {
                    hook.enable()
                    tree.add(currentId());
                    resolve(
                        new Promise(function(resolve) { globalResolve = resolve; })
                        .then(function() {
                            assert.ok(tree.has(currentId()));
                        })
                    );
                })

                setTimeout(function() {
                    globalResolve();
                }, 10);
            })
        });

        it('should preserve async context when using .map', function() {
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(Promise.map([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                    return currentId();
                }).then(function(asyncIds) {
                    for (var i = 0; i < asyncIds.length; ++i) {
                        assert.ok(tree.has(asyncIds[i]));
                    }
                }));
            });
        });

        it('should preserve async context when using .filter', function() {
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(Promise.filter([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                    assert.ok(tree.has(currentId()));
                }));
            });
        });

        it('should preserve async context when using .reduce', function() {
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(Promise.reduce([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                    assert.ok(tree.has(currentId()));
                }));
            });
        });

        it('should preserve async context when using .join', function() {
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(Promise.join(d1, Promise.delay(1), function() {
                    assert.ok(tree.has(currentId()));
                }));
            });
        });

        it('should preserve async context when using .each', function() {
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(Promise.each([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                    assert.ok(tree.has(currentId()));
                }));
            });
        });

        it('should be able to disable AsyncResource usage', function() {
            Promise.config({ asyncHooks: false });
            hook.enable()
            tree.add(currentId());
            var d1 = getAsyncPromise();

            return new Promise(function(resolve, reject) {
                resolve(d1.then(function() {
                    assert.ok(!tree.has(currentId()));
                }));
            });
        });
    });
}
