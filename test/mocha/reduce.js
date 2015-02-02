"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


function promised(val) {
    return new Promise(function(f) {
        setTimeout(function() {
            f(val);
        }, 1);
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
            }, 1);
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
    it("works with no values", function() {
        return Promise.resolve([]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, undefined);
        });
    });

    it("works with a single value", function() {
        return Promise.resolve([ 1 ]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, 1);
        });
    });

    it("works when the iterator returns a value", function() {
        return Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return total + value + 5;
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        });
    });

    it("works when the iterator returns a Promise", function() {
        return Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return promised(5).then(function(bonus) {
                return total + value + bonus;
            });
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        });
    });

    it("works when the iterator returns a thenable", function() {
        return Promise.resolve([ 1, 2, 3 ]).reduce(function(total, value) {
            return thenabled(total + value + 5);
        }).then(function(total) {
            assert.strictEqual(total, (1 + 2+5 + 3+5));
        });
    });
});


describe("Promise.reduce", function() {

    it("should allow returning values", function() {
        var a = [promised(1), promised(2), promised(3)];

        return Promise.reduce(a, function(total, a) {
            return total + a + 5;
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
        });
    });

    it("should allow returning promises", function() {
        var a = [promised(1), promised(2), promised(3)];

        return Promise.reduce(a, function(total, a) {
            return promised(5).then(function(b) {
                return total + a + b;
            });
        }, 0).then(function(total){
            assert.equal(total, 1+5 + 2+5 + 3+5);
        });
    });

    it("should allow returning thenables", function() {
        var b = [1,2,3];
        var a = [];

        return Promise.reduce(b, function(total, cur) {
            a.push(cur);
            return thenabled(3);
        }, 0).then(function(total) {
            assert.equal(total, 3);
            assert.deepEqual(a, b);
        });
    });

    it("propagates error", function() {
        var a = [promised(1), promised(2), promised(3)];
        var e = new Error("asd");
        return Promise.reduce(a, function(total, a) {
            if (a > 2) {
                throw e;
            }
            return total + a + 5;
        }, 0).then(assert.fail, function(err) {
            assert.equal(err, e);
        });
    });

    describe("with no initial accumulator or values", function() {
        it("works when the iterator returns a value", function() {
            return Promise.reduce([], function(total, value) {
                return total + value + 5;
            }).then(function(total){
                assert.strictEqual(total, undefined);
            });
        });

        it("works when the iterator returns a Promise", function() {
            return Promise.reduce([], function(total, value) {
                return promised(5).then(function(bonus) {
                    return total + value + bonus;
                });
            }).then(function(total){
                assert.strictEqual(total, undefined);
            });
        });

        it("works when the iterator returns a thenable", function() {
            return Promise.reduce([], function(total, value) {
                return thenabled(total + value + 5);
            }).then(function(total){
                assert.strictEqual(total, undefined);
            });
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
                        it("works when the iterator returns a value", function() {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return total + value + 5;
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });

                        it("works when the iterator returns a Promise", function() {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return promised(5).then(function(bonus) {
                                    return total + value + bonus;
                                });
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });

                        it("works when the iterator returns a thenable", function() {
                            return Promise.reduce(evaluate(values), function(total, value) {
                                return thenabled(total + value + 5);
                            }, evaluate(initial)).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });
                    });
                });
            });
        });

        it("propagates an initial Error", function() {
            var initial = Promise.reject(ERROR);
            var values = [
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });

        it("propagates a value's Error", function() {
            var initial = 0;
            var values = [
                thenabling(1),
                promisingThen(2)(),
                Promise.reject(ERROR),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });

        it("propagates an Error from the iterator", function() {
            var initial = 0;
            var values = [
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                if (value === 2) {
                    throw ERROR;
                }
                return value;
            }, initial).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });
    });

    describe("with a 0th value acting as an accumulator", function() {
        it("acts this way when an accumulator value is provided yet `undefined`", function() {
            return Promise.reduce([ 1, 2, 3 ], function(total, value) {
                return ((total === void 0) ? 0 : total) + value + 5;
            }, undefined).then(function(total){
                assert.strictEqual(total, (1 + 2+5 + 3+5));
            });
        });

        it("survives an `undefined` 0th value", function() {
            return Promise.reduce([ undefined, 1, 2, 3 ], function(total, value) {
                return ((total === void 0) ? 0 : total) + value + 5;
            }).then(function(total){
                assert.strictEqual(total, (1+5 + 2+5 + 3+5));
            });
        });

        ACCUM_CRITERIA.forEach(function(criteria) {
            var zeroth = criteria.value;

            describe(criteria.desc, function() {
                VALUES_CRITERIA.forEach(function(criteria) {
                    var values = criteria.value;
                    var zerothAndValues = [ zeroth ].concat(values);
                    var valueTotal = criteria.total;

                    describe(criteria.desc, function() {
                        it("works when the iterator returns a value", function() {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return total + value + 5;
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });

                        it("works when the iterator returns a Promise", function() {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return promised(5).then(function(bonus) {
                                    return total + value + bonus;
                                });
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });

                        it("works when the iterator returns a thenable", function() {
                            return Promise.reduce(evaluate(zerothAndValues), function(total, value) {
                                return thenabled(total + value + 5);
                            }).then(function(total){
                                assert.strictEqual(total, valueTotal + (values.length * 5));
                            });
                        });
                    });
                });
            });
        });

        it("propagates an initial Error", function() {
            var values = [
                Promise.reject(ERROR),
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });

        it("propagates a value's Error", function() {
            var values = [
                0,
                thenabling(1),
                promisingThen(2)(),
                Promise.reject(ERROR),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });

        it("propagates an Error from the iterator", function() {
            var values = [
                0,
                thenabling(1),
                promisingThen(2)(),
                promised(3),
                4
            ];

            return Promise.reduce(values, function(total, value) {
                if (value === 2) {
                    throw ERROR;
                }
                return value;
            }).then(assert.fail, function(err) {
                assert.equal(err, ERROR);
            });
        });
    });
});

/*
Based on When.js tests

Open Source Initiative OSI - The MIT License

http://www.opensource.org/licenses/mit-license.php

Copyright (c) 2011 Brian Cavalier

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var sentinel = {};
var other = {};
describe("Promise.reduce-test", function () {

    function plus(sum, val) {
        return sum + val;
    }

    function later(val) {
        return Promise.delay(1, val);
    }


    specify("should reduce values without initial value", function() {
        return Promise.reduce([1,2,3], plus).then(
            function(result) {
                assert.deepEqual(result, 6);
            },
            assert.fail
        );
    });

    specify("should reduce values with initial value", function() {
        return Promise.reduce([1,2,3], plus, 1).then(
            function(result) {
                assert.deepEqual(result, 7);
            },
            assert.fail
        );
    });

    specify("should reduce values with initial promise", function() {
        return Promise.reduce([1,2,3], plus, Promise.resolve(1)).then(
            function(result) {
                assert.deepEqual(result, 7);
            },
            assert.fail
        );
    });

    specify("should reduce promised values without initial value", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.reduce(input, plus).then(
            function(result) {
                assert.deepEqual(result, 6);
            },
            assert.fail
        );
    });

    specify("should reduce promised values with initial value", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.reduce(input, plus, 1).then(
            function(result) {
                assert.deepEqual(result, 7);
            },
            assert.fail
        );
    });

    specify("should reduce promised values with initial promise", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.reduce(input, plus, Promise.resolve(1)).then(
            function(result) {
                assert.deepEqual(result, 7);
            },
            assert.fail
        );
    });

    specify("should reduce empty input with initial value", function() {
        var input = [];
        return Promise.reduce(input, plus, 1).then(
            function(result) {
                assert.deepEqual(result, 1);
            },
            assert.fail
        );
    });

    specify("should reduce empty input with eventual promise", function() {
        return Promise.reduce([], plus, Promise.delay(1, 1)).then(
            function(result) {
                assert.deepEqual(result, 1);
            },
            assert.fail
        );
    });

    specify("should reduce empty input with initial promise", function() {
        return Promise.reduce([], plus, Promise.resolve(1)).then(
            function(result) {
                assert.deepEqual(result, 1);
            },
            assert.fail
        );
    });

    specify("should reject Promise input contains rejection", function() {
        var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
        return Promise.reduce(input, plus, Promise.resolve(1)).then(
            assert.fail,
            function(result) {
                assert.deepEqual(result, 2);
            }
        );
    });

    specify("should reduce to undefined with empty array", function() {
        return Promise.reduce([], plus).then(function(r){
            assert(r === void 0);
        });
    });

    specify("should reduce to initial value with empty array", function() {
        return Promise.reduce([], plus, sentinel).then(function(r){
            assert(r === sentinel);
        });
    });

    specify("should reduce in input order", function() {
        return Promise.reduce([later(1), later(2), later(3)], plus, '').then(
            function(result) {
                assert.deepEqual(result, '123');
            },
            assert.fail
        );
    });

    specify("should accept a promise for an array", function() {
        return Promise.reduce(Promise.resolve([1, 2, 3]), plus, '').then(
            function(result) {
                assert.deepEqual(result, '123');
            },
            assert.fail
        );
    });

    specify("should resolve to initialValue Promise input promise does not resolve to an array", function() {
        return Promise.reduce(Promise.resolve(123), plus, 1).caught(TypeError, function(e){
        });
    });

    specify("should provide correct basis value", function() {
        function insertIntoArray(arr, val, i) {
            arr[i] = val;
            return arr;
        }

        return Promise.reduce([later(1), later(2), later(3)], insertIntoArray, []).then(
            function(result) {
                assert.deepEqual(result, [1,2,3]);
            },
            assert.fail
        );
    });

    describe("checks", function() {
        function later(val, ms) {
            return Promise.delay(ms, val);
        }

        function plus(sum, val) {
            return sum + val;
        }

        function plusDelayed(sum, val) {
            return Promise.delay(0).then(function() {
                return sum + val;
            });
        }

        function check(delay1, delay2, delay3) {
          return Promise.reduce([
            later(1, delay1),
            later(2, delay2),
            later(3, delay3)
          ], plus, '').then(function(result) {
            assert.deepEqual(result, '123');
          })
        }

        function checkDelayed(delay1, delay2, delay3) {
          return Promise.reduce([
            later(1, delay1),
            later(2, delay2),
            later(3, delay3)
          ], plusDelayed, '').then(function(result) {
            assert.deepEqual(result, '123');
          })
        }

        specify("16, 16, 16", function() {
            return check(16, 16, 16);
        });

        specify("16, 16, 4", function() {
            return check(16, 16, 4);
        });
        specify("4, 16, 16", function() {
            return check(4, 16, 16);
        });
        specify("16, 4, 16", function() {
            return check(16, 4, 16);
        });
        specify("16, 16, 4", function() {
            return check(16, 16, 4);
        });
        specify("4, 4, 16", function() {
            return check(4, 4, 16);
        });
        specify("16, 4, 4", function() {
            return check(16, 4, 4);
        });
        specify("4, 16, 4", function() {
            return check(4, 16, 4);
        });
        specify("4, 4, 4", function() {
            return check(4, 4, 4);
        });


        specify("16, 16, 16", function() {
            return checkDelayed(16, 16, 16);
        });

        specify("16, 16, 4", function() {
            return checkDelayed(16, 16, 4);
        });
        specify("4, 16, 16", function() {
            return checkDelayed(4, 16, 16);
        });
        specify("16, 4, 16", function() {
            return checkDelayed(16, 4, 16);
        });
        specify("16, 16, 4", function() {
            return checkDelayed(16, 16, 4);
        });
        specify("4, 4, 16", function() {
            return checkDelayed(4, 4, 16);
        });
        specify("16, 4, 4", function() {
            return checkDelayed(16, 4, 4);
        });
        specify("4, 16, 4", function() {
            return checkDelayed(4, 16, 4);
        });
        specify("4, 4, 4", function() {
            return checkDelayed(4, 4, 4);
        });

    })
});
