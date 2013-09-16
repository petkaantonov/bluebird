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
var assert, fail, sentinel, other;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function fakeResolved(val) {
    return {
        then: function(callback) {
            return fakeResolved(callback ? callback(val) : val);
        }
    };
}

function fakeRejected(reason) {
    return {
        then: function(callback, errback) {
            return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
        }
    };
}

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



define('when.join-test', function (require) {
    var when, delay, resolved, reject;
    when = require('../js/bluebird_debug.js');

    when.defer = when.pending;
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

    var a = when.fulfilled();
    a.constructor.prototype.ensure = a.constructor.prototype.lastly;

    buster.testCase('when.join', {

        'should resolve empty input': function(done) {
            return when.join().then(
                function(result) {
                    assert.equals(result, []);
                },
                fail
            ).ensure(done);
        },

        'should join values': function(done) {
            when.join(1, 2, 3).then(
                function(results) {
                    assert.equals(results, [1, 2, 3]);
                },
                fail
            ).ensure(done);
        },

        'should join promises array': function(done) {
            when.join(resolved(1), resolved(2), resolved(3)).then(
                function(results) {
                    assert.equals(results, [1, 2, 3]);
                },
                fail
            ).ensure(done);
        },

        'should join mixed array': function(done) {
            when.join(resolved(1), 2, resolved(3), 4).then(
                function(results) {
                    assert.equals(results, [1, 2, 3, 4]);
                },
                fail
            ).ensure(done);
        },

        'should reject if any input promise rejects': function(done) {
            when.join(resolved(1), rejected(2), resolved(3)).then(
                fail,
                function(failed) {
                    assert.equals(failed, 2);
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
