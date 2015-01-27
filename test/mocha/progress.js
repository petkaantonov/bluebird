"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
/*!
 *
Copyright 2009–2012 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
// In browsers that support strict mode, it'll be `undefined`; otherwise, the global.
var calledAsFunctionThis = (function () { return this; }());
describe("progress", function () {

    it("calls a single progress listener", function () {
        var progressed = false;
        var deferred = Promise.defer();

        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.equal(progressed,true);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                progressed = true;
            }
        );

        deferred.progress();
        deferred.resolve();

        return promise;
    });

    it("calls multiple progress listeners", function () {
        var progressed1 = false;
        var progressed2 = false;
        var deferred = Promise.defer();
        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.equal(progressed1,true);
                assert.equal(progressed2,true);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                progressed1 = true;
            }
        );
        Promise.resolve(deferred.promise).then(null, null, function () {
            progressed2 = true;
        });

        deferred.progress();
        deferred.resolve();

        return promise;
    });

    it("calls all progress listeners even if one throws", function () {
        var progressed1 = false;
        var progressed2 = false;
        var progressed3 = false;
        var deferred = Promise.defer();
        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.equal(progressed1,true);
                assert.equal(progressed2,true);
                assert.equal(progressed3,true);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                progressed1 = true;
            }
        );

        Promise.onerror = function () { };

        Promise.resolve(deferred.promise).then(null, null, function () {
            progressed2 = true;
            throw new Error("just a test, ok if it shows up in the console");
        });
        Promise.resolve(deferred.promise).then(null, null, function () {
            progressed3 = true;
        });

        deferred.progress();
        deferred.resolve();

        return promise;
    });

    it("calls the progress listener even if later rejected", function () {
        var progressed = false;
        var deferred = Promise.defer();
        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.equal(true,false);
            },
            function () {
                assert.equal(progressed, true);
            },
            function () {
                progressed = true;
            }
        );

        deferred.progress();
        deferred.reject();

        return promise;
    });

    it("calls the progress listener with the notify values", function () {
        var progressValues = [];
        var desiredProgressValues = [{}, {}, "foo", 5];
        var deferred = Promise.defer();
        var promise = Promise.resolve(deferred.promise).then(function () {
                for (var i = 0; i < desiredProgressValues.length; ++i) {
                    var desired = desiredProgressValues[i];
                    var actual = progressValues[i];
                    assert.equal(actual,desired);
                }
            },
            function () {
                assert.equal(true,false);
            },
            function (value) {
                progressValues.push(value);
            }
        );

        for (var i = 0; i < desiredProgressValues.length; ++i) {
            deferred.progress(desiredProgressValues[i]);
        }
        deferred.resolve();

        return promise;
    });

    it("does not call the progress listener if notify is called after fulfillment", function () {
        var deferred = Promise.defer();
        var called = false;

        Promise.resolve(deferred.promise).then(null, null, function () {
            called = true;
        });

        deferred.resolve();
        deferred.progress();

        return Promise.delay(1).then(function () {
            assert.equal(called,false);
        });
    });

    it("does not call the progress listener if notify is called after rejection", function () {
        var deferred = Promise.defer();
        var called = false;

        Promise.resolve(deferred.promise).then(null, null, function () {
            called = true;
        }).then(assert.fail, function(){});

        deferred.reject();
        deferred.progress();

        return Promise.delay(1).then(function () {
            assert.equal(called,false);
        });

        deferred.promise.then(assert.fail, function(){});
    });

    it("should not save and re-emit progress notifications", function () {
        var deferred = Promise.defer();
        var progressValues = [];

        deferred.progress(1);
        //Add Promise.delay(1), cannot pass original when giving async guarantee
        return Promise.delay(1).then(function(){

            var promise = Promise.resolve(deferred.promise).then(function () {
                    assert.deepEqual(progressValues, [2]);
                },
                function () {
                    assert.equal(true, false);
                },
                function (progressValue) {
                    progressValues.push(progressValue);
                }
            );
            deferred.progress(2);
            deferred.resolve();

            return promise;
        });
    });

    it("should allow attaching progress listeners w/ .progress", function () {
        var progressed = false;
        var deferred = Promise.defer();

        deferred.promise.progressed(function () {
            progressed = true;
        });

        deferred.progress();
        deferred.resolve();

        return deferred.promise;
    });

    it("should allow attaching progress listeners w/ Promise.progress", function () {
        var progressed = false;
        var deferred = Promise.defer();

        Promise.resolve(deferred.promise).progressed(function () {
            progressed = true;
        });

        deferred.progress();
        deferred.resolve();

        return deferred.promise;
    });

    it("should call the progress listener with undefined context", function () {
        var progressed = false;
        var progressContext = {};
        var deferred = Promise.defer();
        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.equal(progressed,true);
                assert.equal(progressContext, calledAsFunctionThis);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                progressed = true;
                progressContext = this;
            }
        );

        deferred.progress();
        deferred.resolve();

        return promise;
    });

    it("should forward only the first notify argument to listeners", function () {
        var progressValueArrays = [];
        var deferred = Promise.defer();

        var promise = Promise.resolve(deferred.promise).then(function () {
                assert.deepEqual(progressValueArrays, [[1], [2], [4]]);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                var args = Array.prototype.slice.call(arguments);
                progressValueArrays.push(args);
            }
        );

        deferred.progress(1);
        deferred.progress(2, 3);
        deferred.progress(4, 5, 6);
        deferred.resolve();

        return promise;
    });

    it("should work with .then as well", function () {
        var progressed = false;
        var deferred = Promise.defer();

        var promise = deferred.promise.then(
            function () {
                assert.equal(progressed,true);
            },
            function () {
                assert.equal(true,false);
            },
            function () {
                progressed = true;
            }
        );

        deferred.progress();
        deferred.resolve();

        return promise;
    });

    specify("from fulfilled thenable should not do anything", function() {
        var thenable = {
            then: function(r, _, p) {
                r(1);
                setTimeout(function() {
                    p(1);
                }, 1);
            }
        };
        var progressions = 0;
        var result = Promise.resolve(thenable).progressed(function() {
            progressions++;
        });

        return Promise.delay(result, 1).then(function(result) {
            assert.strictEqual(1, result);
        });
    });

    specify("from fulfilled thenable should not do anything if progress is not a function", function() {
        var thenable = {
            then: function(r, _, p) {
                setTimeout(function() {
                    p(1);
                    setTimeout(function() {
                        r(1);
                    }, 1);
                }, 1);
            }
        };
        var progressions = 0;
        var result = Promise.resolve(thenable);
        result._progress = null;
        result.progressed(function() {
            progressions++;
        });

        return Promise.delay(result, 1).then(function(result) {
            assert.strictEqual(1, result);
        });
    });

    specify("should not choke when internal functions are registered on the promise", function() {
        var d = Promise.defer();
        var progress = 0;

        //calls ._then on the d.promise with smuggled data and void 0 progress handler
        var ret = Promise.race([d.promise]).then(function(v){
            assert(v === 3);
            assert(progress === 1);
        });

        d.promise.progressed(function(v){
            assert(v === 5);
            progress++;
        });

        d.progress(5);

        setTimeout(function(){
            d.fulfill(3);
        }, 1);
        return ret;
    });

    specify("GH-36", function() {
        var order = [];
        var p = Promise.resolve();

        var _d = Promise.defer();
        var progress = 0;

        _d.promise.progressed(function() {
            order.push(1);
            p.then(function() {
                order.push(3);
            })
        })
        _d.progress(progress)
        _d.resolve()


        _d.promise.then(function() {
            order.push(2);
            p.then(function() {
                order.push(4);
            });
        });

        return Promise.delay(1).then(function() {
            assert.deepEqual(order, [1,2,3,4]);
        });
    });

    specify("GH-88", function() {
        var thenable = {
            then: function(f, r, p) {
                setTimeout(function(){
                    var l = 10;
                    while (l--) {
                        p(4);
                    }
                    setTimeout(function(){
                        f(3);
                    }, 1);
                }, 1);
            }
        };

        var promise = Promise.cast(thenable);
        var count = 0;
        promise.progressed(function(v){
            count++;
        });
        return promise.then(function(v) {
            assert.equal(count, 10);
            assert.equal(v, 3);
        });

    });
});
