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



define('when/cancelable-test', function (require) {

    var when, delay, resolved, reject;
    when = require('../js/bluebird_debug.js');


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

    function cancelable(a) {
        return a
    }

    buster.testCase('when/cancelable', {
        'should decorate deferred with a cancel() method': function() {
            var c = cancelable(when.defer(), function() {});
            assert(typeof c.cancel == 'function');
        },

        'should propagate a rejection when a cancelable deferred is canceled': function(done) {
            var c = cancelable(when.defer(), function() { return sentinel; });
            c.cancel();

            c.promise.then(
                fail,
                function(v) {
                    assert.equals(v, sentinel);
                }
            ).ensure(done);
        },

        'should return a promise for canceled value when canceled': function(done) {
            var c, promise;

            c = cancelable(when.defer(), function() { return sentinel; });
            promise = c.cancel();

            promise.then(
                fail,
                function(v) {
                    assert.equals(v, sentinel);
                }
            ).ensure(done);
        },

        'should not invoke canceler when rejected normally': function(done) {
            var c = cancelable(when.defer(), function() { return other; });
            c.reject(sentinel);
            c.cancel();

            c.promise.then(
                fail,
                function(v) {
                    assert.equals(v, sentinel);
                }
            ).ensure(done);
        },

        'should propagate the unaltered resolution value': function(done) {
            var c = cancelable(when.defer(), function() { return other; });
            c.resolve(sentinel);
            c.cancel();

            c.promise.then(
                function(val) {
                    assert.same(val, sentinel);
                },
                function(e) {
                    console.error(e);
                    fail(e);
                }
            ).ensure(done);
        },

        'should call progback for cancelable deferred': function(done) {
            var c = cancelable(when.defer());

            c.promise.then(null, null, function (status) {
                assert.same(status, sentinel);
                done();
            });

            c.notify(sentinel);
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