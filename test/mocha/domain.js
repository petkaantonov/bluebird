"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

if (testUtils.isRecentNode) {
    describe("domain", function() {
        afterEach(function() {
            Promise.onPossiblyUnhandledRejection(null);
        });

        specify("gh-148", function() {
            var called = false;
            var e = new Error();
            Promise.resolve(23).then(function(){called = true});
            return testUtils.awaitDomainException(function(E) {
                assert.equal(e, E);
                assert(called);
            }, function() {
                Promise.onPossiblyUnhandledRejection(function(error) {
                    throw error;
                });
                var P = new Promise(function(_, reject){reject(e);});
            });
        });

        specify("gh-521-promisified", function() {
            return new Promise(function(resolve, reject) {
                var domain = require('domain').create();
                var data = {};

                function callsBack(cb) {
                    setTimeout(function() {
                        cb(null, 1);
                    }, 1);
                }

                var promisified = Promise.promisify(callsBack);
                domain.on('error', reject);
                domain.run(function() {
                    process.domain.data = data;
                    resolve(promisified().then(function() {
                        assert.strictEqual(process.domain.data, data);
                        assert.strictEqual(process.domain, domain);
                    }));
                });
            });
        });

        specify("gh-521-constructed", function() {
            return new Promise(function(resolve, reject) {
                var domain = require('domain').create();
                var data = {asd: 3};
                domain.on('error', reject);
                domain.run(function() {
                    var promise = new Promise(function(resolve) {
                        setTimeout(resolve, 1);
                    });

                    process.domain.data = data;
                    resolve(promise.then(function() {
                        assert.strictEqual(process.domain.data, data);
                        assert.strictEqual(process.domain, domain);
                    }));
                });
            });
        });
    });


}
