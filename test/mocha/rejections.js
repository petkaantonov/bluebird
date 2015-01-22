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
        specify("directly", function(done) {
            var o = nullObject();
            Promise.reject(o).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through constructor by throw", function(done) {
            var o = nullObject();
            new Promise(function() {
                throw o;
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });


        specify("through constructor immediately", function(done) {
            var o = nullObject();
            new Promise(function() {
                arguments[1](o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through constructor eventually", function(done) {
            var o = nullObject();
            new Promise(function(_, r) {
                setTimeout(function() {
                    r(o);
                }, 25);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through defer immediately", function(done) {
            var o = nullObject();
            var d = Promise.defer();
            d.promise.then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
            d.reject(o);
        });

        specify("through defer eventually", function(done) {
            var o = nullObject();
            var d = Promise.defer();
            d.promise.then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
            setTimeout(function() {
                d.reject(o);
            }, 25);
        });

        specify("through thenThrow immediately", function(done) {
            var o = nullObject();
            Promise.resolve().thenThrow(o).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler throw", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                throw o;
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-promise immediately", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return Promise.reject(o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-promise eventually", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return new Promise(function(_, r) {
                    setTimeout(function() {
                        r(o);
                    }, 25);
                });
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-thenable throw", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        throw o;
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-thenable immediately", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        r(o);
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-thenable eventually", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return {
                    then: function(_, r) {
                        setTimeout(function() {
                            r(o);
                        }, 25);
                    }
                };
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        var BluebirdThenable = require("../../js/debug/promise.js")();
        specify("through handler-returned-bluebird-thenable immediately", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return BluebirdThenable.reject(o);
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through handler-returned-bluebird-thenable eventually", function(done) {
            var o = nullObject();
            Promise.resolve().then(function() {
                return new BluebirdThenable(function(_, r) {
                    setTimeout(function() {
                        r(o);
                    }, 25);
                });
            }).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through promisified callback immediately", function(done) {
            var o = nullObject();
            Promise.promisify(function(cb) {
                cb(o);
            })().then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through cancel", function(done) {
            var o = nullObject();
            var a = new Promise(function(){}).cancellable();
            a.then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
            a.cancel(o);
        });

        specify("through progress", function(done) {
            var o = nullObject();
            var d = Promise.defer();

            d.promise.then(assert.fail, assert.fail, function() {
                throw o;
            }).then(assert.fail, assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            })
            d.progress();
        });

        specify("through immediate PromiseArray promise", function(done) {
            var o = nullObject();
            Promise.all([Promise.reject(o)]).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through eventual PromiseArray promise", function(done) {
            var o = nullObject();
            Promise.all([new Promise(function(_, r) {
                setTimeout(function() {
                    r(o);
                }, 25);
            })]).then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

        specify("through promisified callback eventually", function(done) {
            var o = nullObject();
            Promise.promisify(function(cb) {
                setTimeout(function() {
                    cb(o);
                }, 25);
            })().then(assert.fail, function(e) {
                assert.strictEqual(e, o);
                done();
            });
        });

    });
});
