var assert = require("assert");

var adapter = require("../../js/bluebird_debug.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;

var Promise = fulfilled().constructor;

Promise.prototype.progress = Promise.prototype.progressed;


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

Q.delay = function(ms) {
    return new Promise(function(resolver){
        setTimeout(function(){
            resolver.fulfill();
        }, ms);
    });
};

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
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
*/
// In browsers that support strict mode, it'll be `undefined`; otherwise, the global.
var calledAsFunctionThis = (function () { return this; }());
describe("inspect", function () {

    it("for a fulfilled promise", function () {
        var ret = fulfilled(10);
        assert.equal(ret.inspect().value(), 10);
        assert.equal(ret.inspect().isFulfilled(), true );

    });

    it("for a rejected promise", function () {
        var e = new Error("In your face.");
        var ret = rejected(e);
        assert.equal(ret.inspect().error(), e);
        assert.equal(ret.inspect().isRejected(), true );
        ret.caught(function(){})
    });

    it("for a pending, unresolved promise", function () {
        var pending = Q.defer().promise;
        assert.equal(pending.inspect().isPending(), true);
    });

    it("for a promise resolved to a rejected promise", function () {
        var deferred = Q.defer();
        var error = new Error("Rejected!");
        var reject = rejected(error);
        deferred.resolve(reject);

        assert.equal( deferred.promise.inspect().isRejected(), true );
        assert.equal( deferred.promise.inspect().error(), error );
        reject.caught(function(){})
    });

    it("for a promise resolved to a fulfilled promise", function () {
        var deferred = Q.defer();
        var fulfilled = Q(10);
        deferred.resolve(fulfilled);

        assert.equal( deferred.promise.inspect().isFulfilled(), true );
        assert.equal( deferred.promise.inspect().value(), 10 );
    });

    it("for a promise resolved to a pending promise", function () {
        var a = Q.defer();
        var b = Q.defer();
        a.resolve(b.promise);

        assert.equal(a.promise.inspect().isPending(), true);
    });

});