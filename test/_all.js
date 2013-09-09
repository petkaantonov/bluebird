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

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;
define('when.all-test', function (require) {

    var when, resolved, rejected;

    when = require('../js/bluebird.js');

    resolved = when.fulfilled;
    rejected = when.rejected;
    var p = new when();
    p.constructor.prototype.ensure = p.constructor.prototype.resolved;

    buster.testCase('when.all', {

        'should resolve empty input': function(done) {
            return when.all([]).then(
                function(result) {
                    assert.equals(result, []);
                },
                fail
            ).ensure(done);
        },

        'should resolve values array': function(done) {
            var input = [1, 2, 3];
            when.all(input).then(
                function(results) {
                    assert.equals(results, input);
                },
                fail
            ).ensure(done);
        },

        'should resolve promises array': function(done) {
            var input = [resolved(1), resolved(2), resolved(3)];
            when.all(input).then(
                function(results) {
                    assert.equals(results, [1, 2, 3]);
                },
                fail
            ).ensure(done);
        },

        'should resolve sparse array input': function(done) {
            var input = [, 1, , 1, 1 ];
            when.all(input).then(
                function(results) {
                    assert.equals(results, input);
                },
                fail
            ).ensure(done);
        },

        'should reject if any input promise rejects': function(done) {
            var input = [resolved(1), rejected(2), resolved(3)];
            when.all(input).then(
                fail,
                function(failed) {
                    assert.equals(failed, 2);
                }
            ).ensure(done);
        },

        'should accept a promise for an array': function(done) {
            var expected, input;

            expected = [1, 2, 3];
            input = resolved(expected);

            when.all(input).then(
                function(results) {
                    assert.equals(results, expected);
                },
                fail
            ).ensure(done);
        },

        'should resolve to empty array when input promise does not resolve to array': function(done) {
            when.all(resolved(1)).then(
                function(result) {
                    assert.equals(result, []);
                },
                fail
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