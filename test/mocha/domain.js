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


    describe("domain preservation" , function() {
        var Domain = require("domain");

        function createGroupDone(limit, next) {

            return function done(err) {
                if (err) {
                    return next(err);
                }
                if (--limit <= 0) {
                    next();
                }
            };
        }

        before(function () {
            var current;
            while((current = process.domain)) {
                current.exit();
            }
        });

        afterEach(function () {
            var current;
            while((current = process.domain)) {
                current.exit();
            }
        });

        it("should preserve empty domain and this function", function(done) {

            var deferred = new Promise.defer();
            var p = deferred.promise;

            p.then(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
            }).bind({
                ref: 'foo'
            }).then(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).catch(done);

            deferred.resolve("ok");

        });

        it("should preserve empty domain, nodeify", function(done) {
            done = createGroupDone(3, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;

            p.then(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
                done();
            }).bind({
                ref: 'foo'
            }).then(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).nodeify(function shouldKeepThisAndEmptyDomain() {
                try {
                    assert.equal(false, !!process.domain);
                    assert.equal('foo', this.ref);
                    done();
                } catch (err) {
                    done(err);
                }
            }).catch(done);

            deferred.resolve("ok");

        });

        it("should preserve corresponding state of domain", function(done) {

            done = createGroupDone(6, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;

            p.then(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
                done();
            }).bind({
                ref: 'foo'
            }).then(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).nodeify(function shouldKeepThisAndEmptyDomain() {
                try {
                    assert.equal(false, !!process.domain);
                    assert.equal('foo', this.ref);
                    done();
                } catch (err) { done(err); }
            }).catch(done);

            var domain = Domain.create();
            domain.run(function () {
                p.then(function shouldNoBeEmpty() {
                    assert.equal(domain, process.domain);
                    done();
                }).bind({
                    ref: 'bar'
                }).then(function shouldKeepThisAndDomain() {
                    assert.equal(domain, process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain() {
                    try {
                        assert.equal(domain, process.domain);
                        assert.equal('bar', this.ref);
                        done();
                    } catch (err) { done(err); }
                });
            });

            deferred.resolve("ok");

        });

        it('should preserve corresponding state of domain, complex', function(done) {

            done = createGroupDone(9, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;
            p.then(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
                done();
            }).bind({
                ref: 'foo'
            }).then(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).catch(done).nodeify(function shouldKeepThisAndEmptyDomain() {
                try {
                    assert.equal(false, !!process.domain);
                    assert.equal('foo', this.ref);
                    done();
                }
                catch (err) { done(err); }
            }, done);

            var domain1 = Domain.create();
            domain1.run(function () {
                p.then(function shouldNoBeEmpty() {
                    assert.equal(domain1, process.domain);
                    done();
                }).bind({
                    ref: 'bar'
                }).then(function shouldKeepThisAndDomain() {
                    assert.equal(domain1, process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain() {
                    try {
                        assert.equal(domain1, process.domain);
                        assert.equal('bar', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                }, done);
            });

            var domain2 = Domain.create();
            domain2.run(function () {
                p.then(function shouldNoBeEmpty() {
                    assert.equal(domain2, process.domain);
                    done();
                }).bind({
                    ref: 'qaz'
                }).then(function shouldKeepThisAndDomain() {
                    assert.equal(domain2, process.domain);
                    assert.equal('qaz', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain() {
                    try {
                        assert.equal(domain2, process.domain);
                        assert.equal('qaz', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                });
            });

            deferred.resolve("ok");

        });

        it('should preserve corresponding state of domain in reject', function(done) {

            done = createGroupDone(4, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;

            p.bind({
                ref: 'foo'
            }).catch(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).catch(done).nodeify(function shouldKeepThisAndEmptyDomain() {
                try {
                    assert.equal(false, !!process.domain);
                    assert.equal('foo', this.ref);
                    done();
                }
                catch (err) { done(err); }
            });

            var domain = Domain.create();
            domain.run(function () {
                p.bind({
                    ref: 'bar'
                }).catch(function shouldNoBeEmpty() {
                    assert.equal(true, !!process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain(err) {
                    try {
                        assert.equal(true, !!process.domain);
                        assert.equal('bar', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                }).catch(done);
            });

            deferred.reject('bad');

        });

        it('should preserve corresponding state of domain in reject, complex', function(done) {

            done = createGroupDone(6, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;
            p.bind({
                ref: 'foo'
            }).catch(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).catch(done).nodeify(function shouldKeepThisAndEmptyDomain() {
                try {
                    assert.equal(false, !!process.domain);
                    assert.equal('foo', this.ref);
                    done();
                }
                catch (err) { done(err); }
            });

            var domain1 = Domain.create();
            domain1.run(function () {
                p.bind({
                    ref: 'bar'
                }).catch(function shouldNoBeEmpty() {
                    assert.equal(domain1, process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain() {
                    try {
                        assert.equal(domain1, process.domain);
                        assert.equal('bar', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                });
            });

            var domain2 = Domain.create();
            domain2.run(function () {
                p.bind({
                    ref: 'qaz'
                }).catch(function shouldNoBeEmpty() {
                    assert.equal(domain2, process.domain);
                    assert.equal('qaz', this.ref);
                    done();
                }).catch(done).nodeify(function shouldKeepThisAndDomain() {
                    try {
                        assert.equal(domain2, process.domain);
                        assert.equal('qaz', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                });
            });

            deferred.reject('bad');

        });

    });


}
