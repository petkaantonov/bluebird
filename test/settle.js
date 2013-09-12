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

function assertFulfilled(s, value) {
    assert.equals(s.isFulfilled(), true);
    assert.same(s.value(), value);
}

function assertRejected(s, reason) {
    assert.equals(s.isRejected(), true);
    assert.same(s.error(), reason);
}

define('when/settle-test', function (require) {

    when = require('../js/bluebird_debug.js');


    when.resolve = when.fulfilled;
    when.reject = when.rejected;

    when.promise = function( rs ){
        return new when(rs);
    };
    var p = new when();
    p.constructor.prototype.ensure = p.constructor.prototype.resolved;

    buster.testCase('when.settle', {
        'should settle empty array': function() {
            return when.settle([]).then(function(settled) {
                assert.equals(settled.length, 0);
            });
        },

        'should reject if promise for input array rejects': function() {
            return when.settle(when.reject(sentinel)).then(
                fail,
                function(reason) {
                    assert.same(reason, sentinel);
                }
            );
        },

        'should settle values': function() {
            var array = [0, 1, sentinel];
            return when.settle(array).then(function(settled) {
                assertFulfilled(settled[0], 0);
                assertFulfilled(settled[1], 1);
                assertFulfilled(settled[2], sentinel);
            });
        },

        'should settle promises': function() {
            var array = [0, when.resolve(sentinel), when.reject(sentinel)];
            return when.settle(array).then(function(settled) {
                assertFulfilled(settled[0], 0);
                assertFulfilled(settled[1], sentinel);
                assertRejected(settled[2], sentinel);
            });
        },

        'returned promise should fulfill once all inputs settle': function() {
            var array, p1, p2, resolve, reject;

            p1 = when.promise(function(r) { resolve = function(a){r.fulfill(a);}; });
            p2 = when.promise(function(r) { reject = function(a){r.reject(a);}; });

            array = [0, p1, p2];

            setTimeout(function() { resolve(sentinel); }, 0);
            setTimeout(function() { reject(sentinel); }, 0);

            return when.settle(array).then(function(settled) {
                assertFulfilled(settled[0], 0);
                assertFulfilled(settled[1], sentinel);
                assertRejected(settled[2], sentinel);
            });
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