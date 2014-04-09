"use strict";
var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
/*
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


describe("PromiseResolver.callback", function () {

    it("fulfills a promise with a single callback argument", function (done) {
        var resolver = pending();
        resolver.callback(null, 10);
        resolver.promise.then(function (value) {
            assert( value === 10 );
            done();
        });
    });

    it("fulfills a promise with multiple callback arguments", function (done) {
        var resolver = pending();
        resolver.callback(null, 10, 20);
        resolver.promise.then(function (value) {
            assert.deepEqual( value, [ 10, 20 ] );
            done();
        });
    });

    it("rejects a promise", function (done) {
        var resolver = pending();
        var exception = new Error("Holy Exception of Anitoch");
        resolver.callback(exception);
        resolver.promise.then(assert.fail, function (_exception) {
            assert( exception === _exception.cause );
            done();
        });
    });

});
