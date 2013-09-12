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

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;



define('when.any-test', function (require) {

    var when, resolved, rejected;

    when = require('../js/bluebird_debug.js');

    var slice = [].slice;

    resolved = when.fulfilled;
    rejected = when.rejected;
    var resolve = resolved;
    var reject = rejected;
    when.reject = reject;
    when.resolve = resolve;
    var p = new when();
    p.constructor.prototype.ensure = p.constructor.prototype.resolved;

    var defer = when.pending;

    buster.testCase('spread', {
        'should return a promise': function() {
            assert.isFunction(defer().promise.spread().then);
        },

        'should apply onFulfilled with array as argument list': function() {
            var expected = [1, 2, 3];
            return when.resolve(expected).spread(function() {
                assert.equals(slice.call(arguments), expected);
            });
        },

        'should resolve array contents': function() {
            var expected = [when.resolve(1), 2, when.resolve(3)];
            return when.resolve(expected).spread(function() {
                assert.equals(slice.call(arguments), [1, 2, 3]);
            });
        },

        'should reject if any item in array rejects': function() {
            var expected = [when.resolve(1), 2, when.reject(3)];
            return when.resolve(expected)
                .spread(fail)
                .then(fail, function() { assert(true); });
        },

        'when input is a promise': {
            'should apply onFulfilled with array as argument list': function() {
                var expected = [1, 2, 3];
                return when.resolve(when.resolve(expected)).spread(function() {
                    assert.equals(slice.call(arguments), expected);
                });
            },

            'should resolve array contents': function() {
                var expected = [when.resolve(1), 2, when.resolve(3)];
                return when.resolve(when.resolve(expected)).spread(function() {
                    assert.equals(slice.call(arguments), [1, 2, 3]);
                });
            },

            'should reject if input is a rejected promise': function() {
                var expected = when.reject([1, 2, 3]);
                return when.resolve(expected)
                    .spread(fail)
                    .then(fail, function() { assert(true); });
            }
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