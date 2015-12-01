var assert = require("assert");
var testUtils = require("./helpers/util.js");
var assertLongTrace = require("./helpers/assert_long_trace.js");
var nodeVersion = typeof process !== "undefined" &&
        typeof process.version === "string"
        ? process.version.replace(/[^0-9.]/g, "").split(".").map(Number)
        : [-1, -1, -1];

// Node's V8 captureStackTrace is completely broken - it returns different
// results on different runs and sometimes causes this test to fail
if (!Promise.hasLongStackTraces() || testUtils.isOldNode) return;

describe(".then as context", function() {
    it("1 level", function() {
        return Promise.resolve().then(function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
    it("1 level using promise reject with no stack", function() {
        return Promise.resolve().then(function() {
            var e;
            try {throw new Error()} catch (err){e = err;}
            e.stack;
            delete e.stack;
            return Promise.reject(e);
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1, 1]);
        });
    });
    it("4 levels using promise reject", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        var e;
                        try {throw new Error()} catch (err){e = err;}
                        return Promise.reject(e);
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
    it("Circular 1 level", function() {
        var i = 0;
        return (function circle() {
            if (i++ > 5) throw new Error()
            return Promise.resolve().then(circle);
        })().then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("Circular 4 levels", function() {
        var i = 0;
        return (function circle() {
            if (i++ > 5) throw new Error()
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return Promise.resolve().then(circle);
                    });
                });
            });
        })().then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });

    it("followers unaffected", function() {
        return Promise.resolve().then(function() {
            return new Promise(function(res) {
                res(Promise.delay(13).then(function() {
                    return new Promise(function(res) {
                        res(Promise.delay(13).then(function() {
                            throw new Error();
                        }));
                    });
                }));
            }).then(assert.fail, function(e) {
                assertLongTrace(e, 5 + 1, [1, 1, 1, 1, 1]);
                throw new Error();
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 2 + 1, [1, 1]);
        });
    });

    it("3 distinct episodes of circularity with unique frames in between", function() {
        var i = 0;
        var j = 0;
        var k = 0;

        function circle1() {
            if (i++ > 5) return u1_1();
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return Promise.resolve().then(circle1);
                    });
                });
            });
        }

        function circle2() {
            if (j++ > 5) return u2_1();
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return Promise.resolve().then(circle2);
                    });
                });
            });
        }

        function circle3() {
            if (k++ > 5) return u3_1();
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return Promise.resolve().then(circle3);
                    });
                });
            });
        }

        function u1_1() {
            return Promise.resolve().then(u1_2);
        }

        function u1_2() {
            return Promise.resolve().then(circle2);
        }

        function u2_1() {
            return Promise.resolve().then(u2_2);
        }

        function u2_2() {
            return Promise.resolve().then(circle3);
        }

        function u3_1() {
            return Promise.resolve().then(u3_2);
        }

        function u3_2() {
            return Promise.resolve().then(function() {
                throw new Error("The error");
            });
        }

        return circle1().then(assert.fail, function(e) {
            assertLongTrace(e,
                1 + 1 + 1 + 1,
                [
                    1, 1, 2, 1, 1,
                    1, 1, 2, 1, 1,
                    1, 1, 2, 1, 1
                ]);
        });
    });
});

describe(".spread as context", function() {
    it("1 level", function() {
        return Promise.resolve([]).spread(function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.resolve([]).spread(function() {
            return Promise.resolve([]).spread(function() {
                return Promise.resolve([]).spread(function() {
                    return Promise.resolve([]).spread(function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe("constructor as context", function() {
    it("0 level", function() {
        return new Promise(function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1, []);
        });
    });
    it("1 level", function() {
        return new Promise(function(res) {
            res(new Promise(function() {
                throw new Error();
            }))
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [2]);
        });
    });
    it("0 level, no stack property", function() {
        return new Promise(function(_ ,rej) {
            var e = new Error();
            e.stack;
            delete e.stack;
            rej(e);
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1, [1]);
        });
    });
    it("1 level, no stack property", function() {
        return new Promise(function(res) {
            res(new Promise(function(_, rej) {
                var e = new Error();
                e.stack;
                delete e.stack;
                rej(e);
            }))
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1, 1]);
        });
    });

    it("4 levels", function() {
        return new Promise(function(res) {
            res(new Promise(function(res) {
                res(new Promise(function(res) {
                    res(new Promise(function(res) {
                        res(new Promise(function(res) {
                            throw new Error();
                        }));
                    }));
                }));
            }));
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [2, 1, 1, 1]);
        });
    });
});

describe(".join as context", function() {
    it("0 level", function() {
        var err;
        try {throw new Error(); } catch(e) {err = e;};
        return Promise.join(1, 2, Promise.reject(err), function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 0 + 1, []);
        });
    });
    it("1 level", function() {
        return Promise.join(1, 2, 3, function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.join(1, 2, 3, function() {
            return Promise.join(1, 2, 3, function() {
                return Promise.join(1, 2, 3, function() {
                    return Promise.join(1, 2, 3, function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe(".map as context", function() {
    it("1 level", function() {
        return Promise.map([1,2,3], function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.map([1,2,3], function() {
            return Promise.map([1,2,3], function() {
                return Promise.map([1,2,3], function() {
                    return Promise.map([1,2,3], function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe(".reduce as context", function() {
    it("1 level", function() {
        return Promise.reduce([1,2,3], function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.reduce([1,2,3], function() {
            return Promise.reduce([1,2,3], function() {
                return Promise.reduce([1,2,3], function() {
                    return Promise.reduce([1,2,3], function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe(".method as context", function() {
    it("1 level", function() {
        return Promise.method(function() {
            throw new Error();
        })().then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        var second = Promise.method(function() {
            return third();
        });
        var third = Promise.method(function() {
            return fourth();
        });
        var fourth = Promise.method(function() {
            throw new Error();
        });

        return Promise.method(function() {
            return second();
        })().then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [[1,2], 1, 1, 1]);
        });
    });
});

describe(".try as context", function() {
    it("1 level", function() {
        return Promise.attempt(function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });

    it("4 levels", function() {
        return Promise.attempt(function() {
            return Promise.attempt(function() {
                return Promise.attempt(function() {
                    return Promise.attempt(function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe(".using as context", function() {
    it("0 level", function() {
        var err;
        try {throw new Error(); } catch(e) {err = e};
        return Promise.using(1, 2, Promise.reject(err), function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 0 + 1, []);
        });
    });
    it("1 level", function() {
        return Promise.using(1, 2, 3, function() {
            throw new Error();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels", function() {
        return Promise.using(1, 2, 3, function() {
            return Promise.using(1, 2, 3, function() {
                return Promise.using(1, 2, 3, function() {
                    return Promise.using(1, 2, 3, function() {
                        throw new Error();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});

describe("Long stack traces from thenable rejections", function() {
    var es5 = (function(){"use strict"; return this})() === undefined;
    // Todo, for 100% coverage thenables should be tested with every
    // feature, not just then
    var syncRej = function() {
        return {
            then: function(_, rej) {
                rej(new Error());
            }
        };
    };
    var asyncRej = function() {
        return {
            then: function(_, rej) {
                setTimeout(function() {
                    rej(new Error());
                }, 1);
            }
        };
    };
    var throwRej = function() {
        return {
            then: function(_, rej) {
                throw(new Error());
            }
        };
    };
    var thenGetRej = function() {
        var ret = {};
        Object.defineProperty(ret, "then", {
            get: function() {
                throw new Error()
            }
        });
        return ret;
    };
    it("1 level sync reject", function() {
        return Promise.resolve().then(function() {
            return syncRej();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1+1, [1]);
        });
    });
    it("4 levels sync reject", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return syncRej();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
    it("1 level async reject", function() {
        return Promise.resolve().then(function() {
            return asyncRej();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels async reject", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return asyncRej();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
    it("1 level throw", function() {
        return Promise.resolve().then(function() {
            return throwRej();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels throw", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return throwRej();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
    it("1 level getter throw", function() {
        return Promise.resolve().then(function() {
            return thenGetRej();
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 1 + 1, [1]);
        });
    });
    it("4 levels getter throw", function() {
        return Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return thenGetRej();
                    });
                });
            });
        }).then(assert.fail, function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
        });
    });
});
