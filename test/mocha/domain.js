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
            var e = new Error("the error");
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
            }).caught(done);

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
            }).caught(done);

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
            }).caught(done);

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
                }).caught(done).nodeify(function shouldKeepThisAndDomain() {
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
            }).caught(done).nodeify(function shouldKeepThisAndEmptyDomain() {
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
                }).caught(done).nodeify(function shouldKeepThisAndDomain() {
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
                }).caught(done).nodeify(function shouldKeepThisAndDomain() {
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
            }).caught(function shouldKeepThisAndEmptyDomain() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).caught(done).nodeify(function shouldKeepThisAndEmptyDomain() {
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
                }).caught(function shouldNoBeEmpty() {
                    assert.equal(true, !!process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).caught(done).nodeify(function shouldKeepThisAndDomain(err) {
                    try {
                        assert.equal(true, !!process.domain);
                        assert.equal('bar', this.ref);
                        done();
                    }
                    catch (err) { done(err); }
                }).caught(done);
            });

            deferred.reject('bad');

        });

        it('should preserve corresponding state of domain in reject, complex', function(done) {

            done = createGroupDone(6, done);

            var deferred = new Promise.defer();
            var p = deferred.promise;
            p.bind({
                ref: 'foo'
            }).caught(function shouldBeEmpty() {
                assert.equal(false, !!process.domain);
                assert.equal('foo', this.ref);
                done();
            }).caught(done).nodeify(function shouldKeepThisAndEmptyDomain() {
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
                }).caught(function shouldNoBeEmpty() {
                    assert.equal(domain1, process.domain);
                    assert.equal('bar', this.ref);
                    done();
                }).caught(done).nodeify(function shouldKeepThisAndDomain() {
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
                }).caught(function shouldNoBeEmpty() {
                    assert.equal(domain2, process.domain);
                    assert.equal('qaz', this.ref);
                    done();
                }).caught(done).nodeify(function shouldKeepThisAndDomain() {
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

        it('should preserve domain when using .join', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });
            var d2 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.join(d1, d2, function() {
                        assert.strictEqual(domain, process.domain);
                    }));
                });
            });
        });

        it('should preserve domain when using .using', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });
            var d2 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.using(d1, d2, function() {
                        assert.strictEqual(domain, process.domain);
                    }));
                });
            });
        });

        it('should preserve domain when using .map', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.map([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                        return process.domain;
                    }).then(function(domains) {
                        assert.deepEqual([domain, domain, domain, domain], domains);
                        assert.equal(process.domain, domain);
                    }));
                });
            });
        });

        it('should preserve domain when using .filter', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.filter([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                        assert.equal(process.domain, domain);
                    }));
                });
            });
        });

        it('should preserve domain when using .reduce', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.reduce([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                        assert.equal(process.domain, domain);
                    }));
                });
            });
        });

        it('should preserve domain when using .each', function() {
            var domain = Domain.create();
            var d1 = new Promise(function(resolve, reject) {
                Domain.create().run(function() {
                    setTimeout(resolve, 1);
                });
            });

            return new Promise(function(resolve, reject) {
                domain.on("error", reject);
                domain.run(function() {
                    resolve(Promise.each([d1, null, Promise.resolve(1), Promise.delay(1)], function() {
                        assert.equal(process.domain, domain);
                    }));
                });
            });
        });

        it("should not crash with already rejected promise", function() {
            return new Promise(function(resolve) {
                Domain.create().run(function() {
                    Promise.resolve(1).timeout(200).then(function() {
                        resolve();
                    })
                });
            });
        })
    });

}
