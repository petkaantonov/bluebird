var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Using as a rejection reason", function() {
    var nullObject = (function() {
        var es5 = (function(){"use strict";
            return this;
        })() === undefined;
        if (es5) {
            return function() {
                return Object.create(null);
            };
        } else {
            return function() {
                return {};
            };
        }
    })();
    describe("Object.create(null)", function() {
        specify("directly", function() {
            var o = nullObject();
            return Promise.reject(o).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through constructor by throw", function() {
            var o = nullObject();
            return new Promise(function() {
                throw o;
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });


        specify("through constructor immediately", function() {
            var o = nullObject();
            return new Promise(function() {
                arguments[1](o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through constructor eventually", function() {
            var o = nullObject();
            return new Promise(function(_, r) {
                setTimeout(function() {
                    r(o);
                }, 1);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through defer immediately", function() {
            var o = nullObject();
            var d = Promise.defer();
            var ret = d.promise.then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
            d.reject(o);
            return ret;
        });

        specify("through defer eventually", function() {
            var o = nullObject();
            var d = Promise.defer();
            var ret = d.promise.then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
            setTimeout(function() {
                d.reject(o);
            }, 1);
            return ret;
        });

        specify("through thenThrow immediately", function() {
            var o = nullObject();
            return Promise.resolve().thenThrow(o).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler throw", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                throw o;
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-promise immediately", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return Promise.reject(o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-promise eventually", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return new Promise(function(_, r) {
                    setTimeout(function() {
                        r(o);
                    }, 1);
                });
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-thenable throw", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        throw o;
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-thenable immediately", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        r(o);
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-thenable eventually", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        setTimeout(function() {
                            r(o);
                        }, 1);
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        var BluebirdThenable = require("../../js/debug/promise.js")();
        specify("through handler-returned-bluebird-thenable immediately", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return BluebirdThenable.reject(o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through handler-returned-bluebird-thenable eventually", function() {
            var o = nullObject();
            return Promise.resolve().then(function() {
                return new BluebirdThenable(function(_, r) {
                    setTimeout(function() {
                        r(o);
                    }, 1);
                });
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through promisified callback immediately", function() {
            var o = nullObject();
            return Promise.promisify(function(cb) {
                cb(o);
            })().then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through immediate PromiseArray promise", function() {
            var o = nullObject();
            return Promise.all([Promise.reject(o)]).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through eventual PromiseArray promise", function() {
            var o = nullObject();
            return Promise.all([new Promise(function(_, r) {
                setTimeout(function() {
                    r(o);
                }, 1);
            })]).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

        specify("through promisified callback eventually", function() {
            var o = nullObject();
            return Promise.promisify(function(cb) {
                setTimeout(function() {
                    cb(o);
                }, 1);
            })().then(assert.fail, function(e) {
                assert.strictEqual(e, o);
            });
        });

    });
});
