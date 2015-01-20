var Promise = adapter;
var assert = require("assert");
var assertLongTrace = require("./helpers/assert_long_trace.js");
var nodeVersion = typeof process !== "undefined" &&
        typeof process.version === "string"
        ? process.version.replace(/[^0-9.]/g, "").split(".").map(Number)
        : null;

if (!Promise.hasLongStackTraces()) return;
// TODO IE and FireFox
if (!Error.captureStackTrace) return;
// Stack trace capturing is completely screwed in node 0.11.?
if (nodeVersion[0] === 0 && nodeVersion[1] === 11) return;


describe(".then as context", function() {
    it("1 level", function(done) {
        Promise.resolve().then(function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
    it("1 level using promise reject with no stack", function(done) {
        Promise.resolve().then(function() {
            var e;
            try {throw new Error()} catch(err){e = err;}
            e.stack;
            delete e.stack;
            return Promise.reject(e);
        }).caught(function(e) {
            assertLongTrace(e, 2 + 1, [1, 1]);
            done();
        });
    });
    it("4 levels using promise reject", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        var e;
                        try {throw new Error()} catch(err){e = err;}
                        return Promise.reject(e);
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
    it("Circular 1 level", function(done) {
        var i = 0;
        (function circle() {
            if (i++ > 5) throw new Error()
            return Promise.resolve().then(circle);
        })().caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("Circular 4 levels", function(done) {
        var i = 0;
        (function circle() {
            if (i++ > 5) throw new Error()
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return Promise.resolve().then(circle);
                    });
                });
            });
        })().caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });

    it("followers unaffected", function(done) {
        Promise.resolve().then(function() {
            return new Promise(function(res) {
                res(Promise.delay(13).then(function() {
                    return new Promise(function(res) {
                        res(Promise.delay(13).then(function() {
                            throw new Error();
                        }));
                    });
                }));
            }).caught(function(e) {
                assertLongTrace(e, 5 + 1, [1, 1, 1, 1, 1]);
                throw new Error();
            });
        }).caught(function(e) {
            assertLongTrace(e, 2 + 1, [1, 1]);
            done();
        });
    });

    it("3 distinct episodes of circularity with unique frames in between", function(done) {
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

        circle1().caught(function(e) {
            assertLongTrace(e,
                (4 + 1) + (4 + 1) + (4 + 1) + 1,
                [
                    1, 1, 2, 1, 1,
                    1, 1, 2, 1, 1,
                    1, 1, 2, 1, 1
                ]);
            done();
        });
    });
});

describe(".spread as context", function() {
    it("1 level", function(done) {
        Promise.resolve([]).spread(function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.resolve([]).spread(function() {
            return Promise.resolve([]).spread(function() {
                return Promise.resolve([]).spread(function() {
                    return Promise.resolve([]).spread(function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe("constructor as context", function() {
    it("0 level", function(done) {
        new Promise(function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1, []);
            done();
        });
    });
    it("1 level", function(done) {
        new Promise(function(res) {
            res(new Promise(function() {
                throw new Error();
            }))
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [2]);
            done();
        });
    });
    it("0 level, no stack property", function(done) {
        new Promise(function(_ ,rej) {
            var e = new Error();
            e.stack;
            delete e.stack;
            rej(e);
        }).caught(function(e) {
            assertLongTrace(e, 2, [1]);
            done();
        });
    });
    it("1 level, no stack property", function(done) {
        new Promise(function(res) {
            res(new Promise(function(_, rej) {
                var e = new Error();
                e.stack;
                delete e.stack;
                rej(e);
            }))
        }).caught(function(e) {
            assertLongTrace(e, 2 + 1, [1, 1]);
            done();
        });
    });

    it("4 levels", function(done) {
        new Promise(function(res) {
            res(new Promise(function(res) {
                res(new Promise(function(res) {
                    res(new Promise(function(res) {
                        res(new Promise(function(res) {
                            throw new Error();
                        }));
                    }));
                }));
            }));
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [2, 1, 1, 1]);
            done();
        });
    });
});

describe(".join as context", function() {
    it("0 level", function(done) {
        Promise.join(1, 2, Promise.reject(new Error()), function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 0 + 1, []);
            done();
        });
    });
    it("1 level", function(done) {
        Promise.join(1, 2, 3, function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.join(1, 2, 3, function() {
            return Promise.join(1, 2, 3, function() {
                return Promise.join(1, 2, 3, function() {
                    return Promise.join(1, 2, 3, function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe(".map as context", function() {
    it("1 level", function(done) {
        Promise.map([1,2,3], function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.map([1,2,3], function() {
            return Promise.map([1,2,3], function() {
                return Promise.map([1,2,3], function() {
                    return Promise.map([1,2,3], function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe(".reduce as context", function() {
    it("1 level", function(done) {
        Promise.reduce([1,2,3], function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.reduce([1,2,3], function() {
            return Promise.reduce([1,2,3], function() {
                return Promise.reduce([1,2,3], function() {
                    return Promise.reduce([1,2,3], function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe(".method as context", function() {
    it("1 level", function(done) {
        Promise.method(function() {
            throw new Error();
        })().caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        var second = Promise.method(function() {
            return third();
        });
        var third = Promise.method(function() {
            return fourth();
        });
        var fourth = Promise.method(function() {
            throw new Error();
        });

        Promise.method(function() {
            return second();
        })().caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe(".try as context", function() {
    it("1 level", function(done) {
        Promise.attempt(function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });

    it("4 levels", function(done) {
        Promise.attempt(function() {
            return Promise.attempt(function() {
                return Promise.attempt(function() {
                    return Promise.attempt(function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});

describe(".using as context", function() {
    it("0 level", function(done) {
        Promise.using(1, 2, Promise.reject(new Error()), function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 0 + 1, []);
            done();
        });
    });
    it("1 level", function(done) {
        Promise.using(1, 2, 3, function() {
            throw new Error();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels", function(done) {
        Promise.using(1, 2, 3, function() {
            return Promise.using(1, 2, 3, function() {
                return Promise.using(1, 2, 3, function() {
                    return Promise.using(1, 2, 3, function() {
                        throw new Error();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
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
                }, 13);
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
    it("1 level sync reject", function(done) {
        Promise.resolve().then(function() {
            return syncRej();
        }).caught(function(e) {
            assertLongTrace(e, 1+1, [1]);
            done();
        });
    });
    it("4 levels sync reject", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return syncRej();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
    it("1 level async reject", function(done) {
        Promise.resolve().then(function() {
            return asyncRej();
        }).caught(function(e) {
            assertLongTrace(e, 2 + 1, [6, 0]);
            done();
        });
    });
    it("4 levels async reject", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return asyncRej();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [6, 1, 1, 1]);
            done();
        });
    });
    it("1 level throw", function(done) {
        Promise.resolve().then(function() {
            return throwRej();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels throw", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return throwRej();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
    it("1 level getter throw", function(done) {
        Promise.resolve().then(function() {
            return thenGetRej();
        }).caught(function(e) {
            assertLongTrace(e, 1 + 1, [1]);
            done();
        });
    });
    it("4 levels getter throw", function(done) {
        Promise.resolve().then(function() {
            return Promise.resolve().then(function() {
                return Promise.resolve().then(function() {
                    return Promise.resolve().then(function() {
                        return thenGetRej();
                    });
                });
            });
        }).caught(function(e) {
            assertLongTrace(e, 4 + 1, [1, 1, 1, 1]);
            done();
        });
    });
});
