/*Open Source Initiative OSI - The MIT License

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
(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

define('when.map-test', function (require) {

    var when, delay, resolved, reject;
    when = require('../js/bluebird.js');


    when.resolve = when.fulfilled;
    when.reject = when.rejected;
    var delay = function(val, ms) {
        var p = when.pending();
        setTimeout(function(){
            p.fulfill(val);
        }, ms);
        return p.promise
    };

    resolved = when.resolve;
    reject = when.reject;
        var p = new when();
    p.constructor.prototype.ensure = p.constructor.prototype.resolved;

    function mapper(val) {
        return val * 2;
    }

    function deferredMapper(val) {
        return delay(mapper(val), Math.random()*10);
    }

    buster.testCase('when.map', {

        'should map input values array': function(done) {
            var input = [1, 2, 3];
            when.map(input, mapper).then(
                function(results) {
                    assert.equals(results, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should map input promises array': function(done) {
            var input = [resolved(1), resolved(2), resolved(3)];
            when.map(input, mapper).then(
                function(results) {
                    assert.equals(results, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should map mixed input array': function(done) {
            var input = [1, resolved(2), 3];
            when.map(input, mapper).then(
                function(results) {
                    assert.equals(results, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should map input when mapper returns a promise': function(done) {
            var input = [1,2,3];
            when.map(input, deferredMapper).then(
                function(results) {
                    assert.equals(results, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should accept a promise for an array': function(done) {
            when.map(resolved([1, resolved(2), 3]), mapper).then(
                function(result) {
                    assert.equals(result, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should resolve to empty array when input promise does not resolve to an array': function(done) {
            when.map(resolved(123), mapper).then(
                function(result) {
                    assert.equals(result, []);
                },
                fail
            ).ensure(done);
        },

        'should map input promises when mapper returns a promise': function(done) {
            var input = [resolved(1),resolved(2),resolved(3)];
            when.map(input, mapper).then(
                function(results) {
                    assert.equals(results, [2,4,6]);
                },
                fail
            ).ensure(done);
        },

        'should reject when input contains rejection': function(done) {
            var input = [resolved(1), reject(2), resolved(3)];
            when.map(input, mapper).then(
                fail,
                function(result) {
                    assert.equals(result, 2);
                }
            ).ensure(done);
        },

        'should propagate progress': function(done) {
            var input = [1, 2, 3];

            when.map(input, function(x) {
                var d = when.pending();
                d.progress(x);
                setTimeout(d.fulfill.bind(d, x), 0);
                return d.promise;
            }).then(null, null,
                function(update) {
                    assert.equals(update, input.shift());
                }
            ).ensure(done);
        }
    });

});

}(
    this.buster || require('buster'),
    typeof define === 'function' && define.amd ? define : function( name, run ) {
        module.exports = run;
                run(require)
    }
));