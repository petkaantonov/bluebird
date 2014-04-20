"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var Promise = fulfilled().constructor;



var Q = function(p) {
    if( p.then ) return p;
    return fulfilled(p);
};

Q.reject= function(p, cb) {
    return Q(p).then(null, cb);
};

Q.when = function() {
    return Q(arguments[0]).then(arguments[1], arguments[2], arguments[3]);
};

var freeMs;
function resolver( fulfill ) {
    setTimeout(fulfill, freeMs );
};

Q.delay = Promise.delay;

Q.defer = function() {
    var ret = pending();
    return {
        reject: function(a){
            return ret.reject(a)
        },
        resolve: function(a) {
            return ret.fulfill(a);
        },

        notify: function(a) {
            return ret.progress(a);
        },

        promise: ret.promise
    };
};

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
describe("inspect", function () {

    it("for a fulfilled promise", function () {
        var ret = fulfilled(10);
        assert.equal(ret.value(), 10);
        assert.equal(ret.isFulfilled(), true );

    });

    it("for a rejected promise", function () {
        var e = new Error("In your face.");
        var ret = rejected(e);
        assert.equal(ret.reason(), e);
        assert.equal(ret.isRejected(), true );
        ret.caught(function(){})
    });

    it("for a pending, unresolved promise", function () {
        var pending = Q.defer().promise;
        assert.equal(pending.isPending(), true);
    });

    it("for a promise resolved to a rejected promise", function () {
        var deferred = Q.defer();
        var error = new Error("Rejected!");
        var reject = rejected(error);
        deferred.resolve(reject);

        assert.equal( deferred.promise.isRejected(), true );
        assert.equal( deferred.promise.reason(), error );
        deferred.promise.caught(function(){})
    });

    it("for a promise resolved to a fulfilled promise", function () {
        var deferred = Q.defer();
        var fulfilled = Q(10);
        deferred.resolve(fulfilled);

        assert.equal( deferred.promise.isFulfilled(), true );
        assert.equal( deferred.promise.value(), 10 );
    });

    it("for a promise resolved to a pending promise", function () {
        var a = Q.defer();
        var b = Q.defer();
        a.resolve(b.promise);

        assert.equal(a.promise.isPending(), true);
    });

});
