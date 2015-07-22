"use strict";
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
describe("Promise.map-test", function () {

    function mapper(val) {
        return val * 2;
    }

    function deferredMapper(val) {
        return Promise.delay(mapper(val), 1);
    }

    specify("should map input values array", function() {
        var input = [1, 2, 3];
        return Promise.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map input promises array", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map mixed input array", function() {
        var input = [1, Promise.resolve(2), 3];
        return Promise.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map input when mapper returns a promise", function() {
        var input = [1,2,3];
        return Promise.map(input, deferredMapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should accept a promise for an array", function() {
        return Promise.map(Promise.resolve([1, Promise.resolve(2), 3]), mapper).then(
            function(result) {
                assert.deepEqual(result, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should resolve to empty array when input promise does not resolve to an array", function() {
        return Promise.map(Promise.resolve(123), mapper).caught(TypeError, function(e){
        });
    });

    specify("should map input promises when mapper returns a promise", function() {
        var input = [Promise.resolve(1),Promise.resolve(2),Promise.resolve(3)];
        return Promise.map(input, mapper).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should reject when input contains rejection", function() {
        var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
        return Promise.map(input, mapper).then(
            assert.fail,
            function(result) {
                assert(result === 2);
            }
        );
    });

    specify("should propagate progress 2", function() {
         // Thanks @depeele for this test
        var input, ncall;

        input = [_resolver(1), _resolver(2), _resolver(3)];
        ncall = 0;

        function identity(x) {
            return x;
        }

        return Promise.map(input, identity).then(function () {
            assert(ncall === 6);
        }, assert.fail, function () {
            ncall++;
        });

        function _resolver(id) {
          var p = Promise.defer();

          setTimeout(function () {
            var loop, timer;

            loop = 0;
            timer = setInterval(function () {
              p.progress(id);
              loop++;
              if (loop === 2) {
                clearInterval(timer);
                p.resolve(id);
              }
            }, 1);
          }, 1);

          return p.promise;
        }

    });
});

describe("Promise.map-test with concurrency", function () {

    var concurrency = {concurrency: 2};

    function mapper(val) {
        return val * 2;
    }

    function deferredMapper(val) {
        return Promise.delay(mapper(val), 1);
    }

    specify("should map input values array with concurrency", function() {
        var input = [1, 2, 3];
        return Promise.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map input promises array with concurrency", function() {
        var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        return Promise.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map mixed input array with concurrency", function() {
        var input = [1, Promise.resolve(2), 3];
        return Promise.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should map input when mapper returns a promise with concurrency", function() {
        var input = [1,2,3];
        return Promise.map(input, deferredMapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should accept a promise for an array with concurrency", function() {
        return Promise.map(Promise.resolve([1, Promise.resolve(2), 3]), mapper, concurrency).then(
            function(result) {
                assert.deepEqual(result, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should resolve to empty array when input promise does not resolve to an array with concurrency", function() {
        return Promise.map(Promise.resolve(123), mapper, concurrency).caught(TypeError, function(e){
        });
    });

    specify("should map input promises when mapper returns a promise with concurrency", function() {
        var input = [Promise.resolve(1),Promise.resolve(2),Promise.resolve(3)];
        return Promise.map(input, mapper, concurrency).then(
            function(results) {
                assert.deepEqual(results, [2,4,6]);
            },
            assert.fail
        );
    });

    specify("should reject when input contains rejection with concurrency", function() {
        var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
        return Promise.map(input, mapper, concurrency).then(
            assert.fail,
            function(result) {
                assert(result === 2);
            }
        );
    });

    specify("should propagate progress 2 with concurrency", function() {
         // Thanks @depeele for this test
        var input, ncall;

        input = [_resolver(1), _resolver(2), _resolver(3)];
        ncall = 0;

        function identity(x) {
            return x;
        }
        return Promise.map(input, identity, concurrency).then(function () {
            assert(ncall === 6);
        }, assert.fail, function () {
            ncall++;
        });

        function _resolver(id) {
          var p = Promise.defer();

          setTimeout(function () {
            var loop, timer;

            loop = 0;
            timer = setInterval(function () {
              p.progress(id);
              loop++;
              if (loop === 2) {
                clearInterval(timer);
                p.resolve(id);
              }
            }, 1);
          }, 1);

          return p.promise;
        }

    });


    specify("should not have more than {concurrency} promises in flight", function() {
        var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var b = [];
        var now = Date.now();

        var immediates = [];
        function immediate(index) {
            var resolve;
            var ret = new Promise(function(){resolve = arguments[0]});
            immediates.push([ret, resolve, index]);
            return ret;
        }

        var lates = [];
        function late(index) {
            var resolve;
            var ret = new Promise(function(){resolve = arguments[0]});
            lates.push([ret, resolve, index]);
            return ret;
        }


        function promiseByIndex(index) {
            return index < 5 ? immediate(index) : late(index);
        }

        function resolve(item) {
            item[1](item[2]);
        }

        var ret1 = Promise.map(array, function(value, index) {
            return promiseByIndex(index).then(function() {
                b.push(value);
            });
        }, {concurrency: 5});

        var ret2 = Promise.delay(1).then(function() {
            assert.strictEqual(0, b.length);
            immediates.forEach(resolve);
            return immediates.map(function(item){return item[0]});
        }).delay(1).then(function() {
            assert.deepEqual(b, [0, 1, 2, 3, 4]);
            lates.forEach(resolve);
        }).delay(1).then(function() {
            assert.deepEqual(b, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            lates.forEach(resolve);
        }).thenReturn(ret1).then(function() {
            assert.deepEqual(b, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });
        return Promise.all([ret1, ret2]);
    });
});
