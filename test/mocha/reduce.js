"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var Promise = adapter;
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

function promised(val) {
    return new Promise(function(f) {
        setTimeout(function() {
            f(val);
        }, 4);
    });
}
function promising(val) {
    return function() {
        return promised(val);
    }
}
function promisingThen(val) {
    return function() {
        return promised(val).then(function(resolved) {
            return resolved;
        });
    }
}

function thenabled(val) {
    return {
        then: function(f){
            setTimeout(function() {
                f(val);
            }, 4);
        }
    };
}
function thenabling(val) {
    return function() { return thenabled(val); }
}

function evaluate(val) {
    if (typeof val === 'function') {
        val = val();
    }
    if (Array.isArray(val)) {
        val = val.map(function(member) {
            return evaluate(member);
        });
    }
    return val;
}


var ACCUM_CRITERIA = [
    { value: 0,                desc: "that is resolved" },
    { value: promising(0),     desc: "as a Promise" },
    { value: promisingThen(0), desc: "as a deferred Promise" },
    { value: thenabling(0),    desc: "as a thenable" },
];

var VALUES_CRITERIA = [
    { value: [],               total: 0, desc: "and no values" },
    { value: [ 1 ],            total: 1, desc: "and a single resolved value" },
    { value: [ 1, 2, 3 ],      total: 6, desc: "and multiple resolved values" },
    { value: [ promising(1) ], total: 1, desc: "and a single Promise" },
    { value: [
        promising(1),
        promising(2),
        promising(3)
    ], total: 6, desc: "and multiple Promises" },
    { value: [
        promisingThen(1)
    ], total: 1, desc: "and a single deferred Promise" },
    { value: [
        promisingThen(1),
        promisingThen(2),
        promisingThen(3)
    ], total: 6, desc: "and multiple deferred Promises" },
    { value: [
        thenabling(1)
    ], total: 1, desc: "and a single thenable" },
    { value: [
        thenabling(1),
        thenabling(2),
        thenabling(3)
    ], total: 6, desc: "and multiple thenables" },
    { value: [
        thenabling(1),
        promisingThen(2),
        promising(3),
        4
    ], total: 10, desc: "and a blend of values" },
];

var ERROR = new Error("BOOM");


describe("Promise.prototype.reduce", function() {
    it("works with no values", function(done) {
        Promise.resolve([]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, undefined);
        }).nodeify(done);
    });

    it("works with a single value", function(done) {
        Promise.resolve([ 1 ]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, 1);
        }).nodeify(done);
    });

    it("works when the iterator returns a value", function(done) {
        Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        }).nodeify(done);
    });

    it("works when the iterator returns a Promise", function(done) {
        Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return promised(5).then(function(bonus) {
                return total + value + bonus;
            });
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        }).nodeify(done);
    });

    it("works when the iterator returns a thenable", function(done) {
        Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return thenabled(total + value + 5);
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        }).nodeify(done);
    });
});


describe("Promise.reduce", function() {

    it("should allow returning values", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.reduce(a, function(total, a) {
            return total + a + 5;
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
            done();
        });
    });

    it("should allow returning promises", function(done) {
        var a = [promised(1), promised(2), promised(3)];

        Promise.reduce(a, function(total, a) {
            return promised(5).then(function(b) {
                return total + a + b;
            });
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
            done();
        });
    });

    it("should allow returning thenables", function(done) {
        var b = [1,2,3];
        var a = [];

        Promise.reduce(b, function(total, cur) {
            a.push(cur);
            return thenabled(3);
        }, 0).then(function(total){
            assert.equal(total, 3);
            assert.deepEqual(a, b),
            done();
        });
    });

    it("propagates error", function(done) {
        var a = [promised(1), promised(2), promised(3)];
        var e = new Error("asd");
        Promise.reduce(a, function(total, a) {
            if (a > 2) {
                throw e;
            }
            return total + a + 5;
        }, 0).then(assert.fail, function(err) {
            assert.equal(err, e);
            done();
        });
    });

    describe("with no initial accumulator or values", function() {
        it("works when the iterator returns a value", function(done) {
            return Promise.reduce([], function(total, value) {
                return total + value + 5;
            }).then(function(total){
                assert.strictEqual(total, undefined);
            }).nodeify(done);
        });

        it("works when the iterator returns a Promise", function(done) {
            return Promise.reduce([], function(total, value) {
                return promised(5).then(function(bonus) {
                    return total + value + bonus;
                });
            }).then(function(total){
                assert.strictEqual(total, undefined);
            }).nodeify(done);
        });

        it("works when the iterator returns a thenable", function(done) {
            return Promise.reduce([], function(total, value) {
                return thenabled(total + value + 5);
            }).then(function(total){
                assert.strictEqual(total, undefined);
            }).nodeify(done);
        });
    });

    describe("with an initial accumulator value", function() {
        ACCUM_CRITERIA.forEach(function(criteria) {
            var initial = criteria.value;

            describe(criteria.desc, function() {
                VALUES_CRITERIA.forEach(function(criteria) {
                    var values = criteria.value;
                    var valueTotal = criteria.total;

                    describe(criteria.desc, function() {
                        it("works when the iterator returns a value", function(done) {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return total + value + 5;
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });

                        it("works when the iterator returns a Promise", function(done) {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return promised(5).then(function(bonus) {
                                    return total + value + bonus;
                                });
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });

                        it("works when the iterator returns a thenable", function(done) {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return thenabled(total + value + 5);
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });
                    });
                });
            });
        });

        it("propagates an initial Error", function(done) {
            var initial = Promise.reject(ERROR);
            var values = [
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });

        it("propagates a value's Error", function(done) {
            var initial = 0;
            var values = [
                thenabling(1),
                promisingThen(2)(),
                Promise.reject(ERROR),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });

        it("propagates an Error from the iterator", function(done) {
            var initial = 0;
            var values = [
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                if (value === 2) {
                    throw ERROR;
                }
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });
    });

    describe("with a 0th value acting as an accumulator", function() {
        it("acts this way when an accumulator value is provided yet `undefined`", function(done) {
            return Promise.reduce([ 1, 2, 3 ], function(total, value) {
                return ((total === void 0) ? 0 : total) + value + 5;
            }, undefined).then(function(total){
                assert.strictEqual(total, (1 + 2+5 + 3+5));
            }).nodeify(done);
        });

        it("survives an `undefined` 0th value", function(done) {
            return Promise.reduce([ undefined, 1, 2, 3 ], function(total, value) {
                return ((total === void 0) ? 0 : total) + value + 5;
            }).then(function(total){
                assert.strictEqual(total, (1+5 + 2+5 + 3+5));
            }).nodeify(done);
        });

        ACCUM_CRITERIA.forEach(function(criteria) {
            var zeroth = criteria.value;

            describe(criteria.desc, function() {
                VALUES_CRITERIA.forEach(function(criteria) {
                    var values = criteria.value;
                    var zerothAndValues = [ zeroth ].concat(values);
                    var valueTotal = criteria.total;

                    describe(criteria.desc, function(done) {
                        it("works when the iterator returns a value", function(done) {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return total + value + 5;
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });

                        it("works when the iterator returns a Promise", function(done) {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return promised(5).then(function(bonus) {
                                    return total + value + bonus;
                                });
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });

                        it("works when the iterator returns a thenable", function(done) {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return thenabled(total + value + 5);
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            }).nodeify(done);
                        });
                    });
                });
            });
        });

        it("propagates an initial Error", function(done) {
            var values = [
                Promise.reject(ERROR),
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });

        it("propagates a value's Error", function(done) {
            var values = [
                0,
                thenabling(1),
                promisingThen(2)(),
                Promise.reject(ERROR),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });

        it("propagates an Error from the iterator", function(done) {
            var values = [
                0,
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            Promise.reduce(values, function(total, value) {
                if (value === 2) {
                    throw ERROR;
                }
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
                done();
            });
        });
    });
});
