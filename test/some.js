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

function throwOnError(e) {
    var stack = e.error.stack;
    var message = "";
    if( stack ) {
        message = stack;
    }
    else {
        message = e.error.name + " in '" + e.name + "' " + e.error.message;
    }
    console.error(message);
    process.exit(-1);
}
buster.eventEmitter.on( "test:failure", throwOnError);
buster.eventEmitter.on( "test:timeout", throwOnError);

function contains(array, value) {
    for(var i = array.length-1; i >= 0; i--) {
        if(array[i] === value) {
            return true;
        }
    }

    return false;
}

function isSubset(subset, superset) {
    var i, subsetLen;

    subsetLen = subset.length;

    if (subsetLen > superset.length) {
        return false;
    }

    for(i = 0; i<subsetLen; i++) {
        if(!contains(superset, subset[i])) {
            return false;
        }
    }

    return true;
}

define('when.some-test', function (require) {

    var when, resolved, rejected;

    when = require('../js/bluebird_debug.js');

    resolved = when.fulfilled;
    rejected = when.rejected;
    var p = new when();
    p.constructor.prototype.ensure = p.constructor.prototype.resolved;

    buster.testCase('when.some', {

        'should resolve empty input': function(done) {
            when.some([], 1).then(
                function(result) {
                    assert.equals(result, []);
                },
                fail
            ).ensure(done);
        },

        'should resolve values array': function(done) {
            var input = [1, 2, 3];
            when.some(input, 2).then(
                function(results) {
                    assert(isSubset(results, input));
                },
                fail
            ).ensure(done);
        },

        'should resolve promises array': function(done) {
            var input = [resolved(1), resolved(2), resolved(3)];
            when.some(input, 2).then(
                function(results) {
                    assert(isSubset(results, [1, 2, 3]));
                },
                fail
            ).ensure(done);
        },

        'should resolve sparse array input': function(done) {
            var input = [, 1, , 2, 3 ];
            when.some(input, 2).then(
                function(results) {
                    assert(isSubset(results, input));
                    done();
                },
                fail
            );
        },

        'should reject with all rejected input values if resolving howMany becomes impossible': function(done) {
            var input = [resolved(1), rejected(2), rejected(3)];
            when.some(input, 2).then(
                fail,
                function(failed) {
                    assert.equals(failed, [2, 3]);
                }
            ).ensure(done);
        },

        'should accept a promise for an array': function(done) {
            var expected, input;

            expected = [1, 2, 3];
            input = resolved(expected);

            when.some(input, 2).then(
                function(results) {
                    assert.equals(results.length, 2);
                },
                fail
            ).ensure(done);
        },

        'should resolve to empty array when input promise does not resolve to array': function(done) {
            when.some(resolved(1), 1).then(
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