var Promise = adapter;
var assert = require("assert");

if (!Promise.hasLongStackTraces()) return;

function assertLongTrace(error, expectedJumpCount, expectedFramesForJumpsMap) {
    var envFramePattern = /(?:\(node.js:|\(module.js:)/;
    var stack = error.stack.split("\n");
    var frameLinePattern = /(^\s+at|@|\s+\(No stack trace\))/;
    var previousEventPattern = /^From previous event/;
    var firstLine;
    for (var i = 0; i < stack.length; ++i) {
        if (previousEventPattern.test(stack[i])) {
            throw new Error("From previous event before any frames");
        }
        if (frameLinePattern.test(stack[i])) {
            firstLine = i - 1;
            break;
        }
    }
    var prev = stack[firstLine - 1];
    var jumpCount = 1;
    var jumpIndex = 0;
    var currentJumpFramesCount = 0;
    for (var i = firstLine; i < stack.length; ++i) {
        var line = stack[i];
        if (previousEventPattern.test(line)) {
            if (previousEventPattern.test(prev)) {
                throw new Error("2 consecutive From previous events");
            }
            if (jumpIndex < expectedFramesForJumpsMap.length) {
                assert.strictEqual(expectedFramesForJumpsMap[jumpIndex],
                    currentJumpFramesCount,
                    "Expected " + (jumpIndex+1) + "nth jump to contain" +
                    expectedFramesForJumpsMap[jumpIndex] + " frames " +
                    "but it contains " + currentJumpFramesCount + " frames");
            }
            jumpCount++;
            jumpIndex++;
            currentJumpFramesCount = 0;
        } else if (frameLinePattern.test(line) && !envFramePattern.test(line)) {
            currentJumpFramesCount++;
        }
        prev = line;
    }
    assert.strictEqual(
        previousEventPattern.test(stack[stack.length - 1]), false,
        "The last line cannot be 'From previous event:'");
    assert.strictEqual(expectedJumpCount, jumpCount, "Expected " +
        expectedJumpCount + " jumps but saw " + jumpCount + " jumps");

    if (jumpCount > (expectedFramesForJumpsMap.length + 1)) {
        throw new Error("All jumps except the last one require an "+
            "expected frame count. " +
            "Got expected frame counts for only " +
            expectedFramesForJumpsMap.length + " while " + (jumpCount-1) +
            " was expected");
    }

}

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
