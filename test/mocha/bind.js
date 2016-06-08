"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");
var defaultThis = function() {return this}();

function timedThenableOf(value) {
    return {
        then: function(onFulfilled) {
            setTimeout(function() {
                onFulfilled(value);
            }, 1);
        }
    };
}

function timedPromiseOf(value) {
    return Promise.delay(1, value);
}

function immediatePromiseOf(value) {
    return Promise.resolve(value);
}

function immediateThenableOf(value) {
    return {
        then: function(onFulfilled) {
            onFulfilled(value);
        }
    };
}

function timedRejectedThenableOf(value) {
    return {
        then: function(onFulfilled, onRejected) {
            setTimeout(function() {
                onRejected(value);
            }, 1);
        }
    };
}

function timedRejectedPromiseOf(value) {
    return Promise.delay(1).then(function() {
        throw value;
    });
}

function immediateRejectedPromiseOf(value) {
    return Promise.reject(value);
}

function immediateRejectedThenableOf(value) {
    return {
        then: function(onFulfilled, onRejected) {
            onRejected(value);
        }
    };
}

function toValue(valueOrPromise) {
    if (valueOrPromise && typeof valueOrPromise.value === "function") {
        return valueOrPromise.value();
    }
    return valueOrPromise
}

var THIS = {name: "this"};

function CustomError1() {}
CustomError1.prototype = Object.create(Error.prototype);
function CustomError2() {}
CustomError2.prototype = Object.create(Error.prototype);


describe("when using .bind", function() {
    describe("with finally", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function() {
                return Promise.resolve().bind(THIS).lastly(function(){
                    assert(this === THIS);
                });
            });

            specify("after promise returned from finally resolves", function() {
                var d = Promise.defer();
                var promise = d.promise;
                var waited = false;

                setTimeout(function(){
                    waited = true;
                    d.fulfill();
                }, 1);

                return Promise.resolve().bind(THIS).lastly(function(){
                    return promise;
                }).lastly(function(){
                    assert(waited);
                    assert(this === THIS);
                });
            });
        })

    });

    describe("with tap", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function() {
                return Promise.resolve().bind(THIS).tap(function(){
                    assert(this === THIS);
                });
            });

            specify("after promise returned from tap resolves", function() {
                var d = Promise.defer();
                var promise = d.promise;
                var waited = false;
                setTimeout(function(){
                    waited = true;
                    d.fulfill();
                }, 1);

                return Promise.resolve().bind(THIS).tap(function(){
                    return promise;
                }).tap(function(){
                    assert(waited);
                    assert(this === THIS);
                });
            });
        })

    });

    describe("with timeout", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function() {
                return Promise.resolve(3).bind(THIS).timeout(500).then(function(v) {
                    assert(v === 3);
                    assert(this === THIS);
                });
            });
            specify("in rejected handler", function() {
                return Promise.reject(3).bind(THIS).timeout(500).then(assert.fail, function(v){
                    assert(v === 3);
                    assert(this === THIS);
                });
            });

            specify("in rejected handler after timeout", function() {
                return new Promise(function(){})
                    .bind(THIS).timeout(10).caught(Promise.TimeoutError, function(err){
                    assert(this === THIS);
                });
            });
        })

    });

    describe("With catch filters", function() {
        describe("this should refer to the bound object", function() {
            specify("in an immediately trapped catch handler", function() {
                return Promise.resolve().bind(THIS).then(function(){
                    assert(THIS === this);
                    var a;
                    a.b();
                }).caught(Error, function(e){
                    assert(THIS === this);
                });
            });
            specify("in a later trapped catch handler", function() {
                return Promise.resolve().bind(THIS).then(function(){
                   throw new CustomError1();
                }).caught(CustomError2, assert.fail)
                .caught(CustomError1, function(e){
                    assert(THIS === this);
                });
            });
        });
    });

    describe("With .get promises", function(){
        specify("this should refer to the bound object", function() {
            return Promise.resolve({key: "value"}).bind(THIS).get("key").then(function(val){
                assert(val === "value");
                assert(this === THIS);
            });
        });
    });

    describe("With .call promises", function(){
        specify("this should refer to the bound object", function() {
            return Promise.resolve({key: function(){return "value";}}).bind(THIS).call("key").then(function(val){
                assert(val === "value");
                assert(this === THIS);
            });
        });
    });


    describe("With .done promises", function(){

        describe("this should refer to the bound object", function() {
            specify("when rejected", function() {
                return Promise.reject().bind(THIS).done(assert.fail, function(){
                    assert(this === THIS);
                });
            });
            specify("when fulfilled", function() {
                return Promise.resolve().bind(THIS).done(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With .spread promises", function(){

        describe("this should refer to the bound object", function() {
            specify("when spreading immediate array", function() {
                return Promise.resolve([1,2,3]).bind(THIS).spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                });
            });
            specify("when spreading eventual array", function() {
                var d = Promise.defer();
                var promise = d.promise;

                setTimeout(function(){
                    d.fulfill([1,2,3]);
                }, 1);

                return promise.bind(THIS).spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                });
            });

            specify("when spreading eventual array of eventual values", function() {
                var d = Promise.defer();
                var promise = d.promise;
                setTimeout(function(){
                    var d1 = Promise.defer();
                    var p1 = d1.promise;

                    var d2 = Promise.defer();
                    var p2 = d2.promise;

                    var d3 = Promise.defer();
                    var p3 = d3.promise;
                    d.fulfill([p1, p2, p3]);

                    setTimeout(function(){
                        d1.fulfill(1);
                        d2.fulfill(2);
                        d3.fulfill(3);
                    }, 3);
                }, 1);
                return promise.bind(THIS).all().spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                });

            });
        });
    });

    describe("With nodeify", function() {
        describe("this should refer to the bound object", function() {
            specify("when the callback succeeeds", function() {
                var spy = testUtils.getSpy();
                Promise.resolve(3).bind(THIS).nodeify(spy(function(err, success){
                    assert(success === 3);
                    assert(this === THIS);
                }));
                return spy.promise;
            });
            specify("when the callback errs", function() {
                var spy = testUtils.getSpy();
                Promise.reject(3).bind(THIS).nodeify(spy(function(err, success){
                    assert(err === 3);
                    assert(this === THIS);
                }));
                return spy.promise;
            });
        });
    });


    describe("With map", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the mapper with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).map(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });
            specify("inside the mapper with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).map(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });

            specify("after the mapper with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });
            });

            specify("after the mapper with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).map(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });


            });

            specify("after the mapper with immediate values when the map returns promises", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });

            });
        });
    });

    describe("With reduce", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the reducer with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).reduce(function(prev, v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });
            specify("inside the reducer with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).reduce(function(prev, v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });

            specify("after the reducer with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });
            });

            specify("after the reducer with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;
                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);
                return Promise.resolve([p1, p2, p3]).bind(THIS).reduce(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });

            });

            specify("after the reducer with immediate values when the reducer returns promise", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                });


            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });


            });
        });
    });


    describe("With filter", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the filterer with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).filter(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });
            specify("inside the filterer with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).filter(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                    }
                });
            });

            specify("after the filterer with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });
            });

            specify("after the filterer with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).filter(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                });
            });

            specify("after the filterer with immediate values when the filterer returns promises", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With all", function() {
        describe("this should refer to the bound object", function() {
            specify("after all with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).all().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                });
            });
            specify("after all with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).all().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.all([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With any", function() {
        describe("this should refer to the bound object", function() {
            specify("after any with immediate values", function() {
                Promise.resolve([1,2,3]).bind(THIS).any().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                });
            });
            specify("after any with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).any().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.any([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });

            });
        });
    });


    describe("With race", function() {
        describe("this should refer to the bound object", function() {
            specify("after race with immediate values", function() {
                Promise.resolve([1,2,3]).bind(THIS).race().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                });
            });
            specify("after race with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).race().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.race([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With delay", function() {
        describe("this should refer to the bound object", function() {
            specify("after race with immediate values", function() {
                Promise.resolve([1,2,3]).bind(THIS).delay(1).then(function(v){
                    assert(v[0] === 1);
                    assert(this === THIS);
                });
            });
            specify("after race with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).delay(1).all().then(function(v){
                    assert(v[0] === 1);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).delay(1).bind(THIS).delay(1).filter(function(){
                    assert(this === THIS);
                    return Promise.delay(1).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With settle", function() {
        describe("this should refer to the bound object", function() {
            specify("after settle with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).settle().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                });
            });
            specify("after settle with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).settle().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.settle([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });

    describe("With some", function() {
        describe("this should refer to the bound object", function() {
            specify("after some with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                });
            });
            specify("after some with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                });
            });

            specify("after some with eventual array for eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                var dArray = Promise.defer();
                var arrayPromise = dArray.promise;

                setTimeout(function(){
                    dArray.fulfill([p1, p2, p3]);
                    setTimeout(function(){
                        d1.fulfill(1);
                        d2.fulfill(2);
                        d3.fulfill(3);
                    }, 1);
                }, 1);

                return arrayPromise.bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);

                return Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.some([p1], 1).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });
            });
        });
    });



    describe("With props", function() {
        describe("this should refer to the bound object", function() {
            specify("after props with immediate values", function() {
                return Promise.resolve([1,2,3]).bind(THIS).props().then(function(v){
                    assert(v[2] === 3);
                    assert(this === THIS);
                });
            });
            specify("after props with eventual values", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 1);

                return Promise.resolve([p1, p2, p3]).bind(THIS).props().then(function(v){
                    assert(v[2] === 3);
                    assert(this === THIS);
                });
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function() {
                var d1 = Promise.defer();
                var p1 = d1.promise;
                setTimeout(function(){
                    d1.fulfill(1);
                }, 1);
                return Promise.resolve([1,2,3]).bind(THIS).props(function(){
                    return Promise.settle([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                });


            });
        });
    });

});

describe("When using .bind to gratuitously rebind", function() {
    var a = {value: 1};
    var b = {value: 2};
    var c = {value: 3};

    function makeTest(a, b, c) {
        return function() {
            return Promise.bind(a).then(function(){
                assert(this.value === 1);
            }).bind(b).then(function(){
                assert(this.value === 2);
            }).bind(c).then(function(){
                assert(this.value === 3);
            });
        }
    }

    specify("should not get confused immediately", makeTest(a, b, c));
    specify("should not get confused immediate thenable",
        makeTest(immediateThenableOf(a), immediateThenableOf(b), immediateThenableOf(c)));
    specify("should not get confused immediate promise",
        makeTest(immediatePromiseOf(a), immediatePromiseOf(b), immediatePromiseOf(c)));
    specify("should not get confused timed thenable",
        makeTest(timedThenableOf(a), timedThenableOf(b), timedThenableOf(c)));
    specify("should not get confused timed promise",
        makeTest(timedPromiseOf(a), timedPromiseOf(b), timedPromiseOf(c)));
});

describe("Promised thisArg", function() {

    var e = {value: 1};

    specify("basic case, this first", function(done) {
        var thisPromise = Promise.delay(1, 1);
        var promise = thisPromise.delay(1).thenReturn(2);
        promise.bind(thisPromise).then(function(val) {
            assert(+this === 1);
            assert(+val === 2);
            done();
        });
    });

    specify("bound value is not changed by returned promise", function() {
        return Promise.resolve().then(function() {
          return new Promise(function(resolve) {
            resolve();
          }).bind(THIS).then(function() {});
        }).then(function() {
            assert.strictEqual(this, defaultThis);
        });
    });

    specify("basic case, main promise first", function() {
        var promise = Promise.delay(1, 2);
        var thisPromise = promise.thenReturn(1);
        return promise.bind(thisPromise).then(function(val) {
            assert.strictEqual(+this, 1);
            assert.strictEqual(+val, 2);
        });
    });

    specify("both reject, this rejects first", function(done) {
        var e1 = new Error();
        var e2 = new Error();
        var thisPromise = Promise.delay(1, 0).thenThrow(e1);
        var promise = Promise.delay(2, 56).thenThrow(e2);
        promise.bind(thisPromise).then(null, function(reason) {
            assert(this === defaultThis);
            assert(reason === e1);
            done();
        });
    });

    specify("both reject, main promise rejects first", function(done) {
        var e1 = new Error("first");
        var e2 = new Error("second");
        var thisPromise = Promise.delay(56, 1).thenThrow(e1);
        var promise = Promise.delay(2, 0).thenThrow(e2);
        promise.bind(thisPromise).then(null, function(reason) {
            assert(this === defaultThis);
            assert(reason === e2);
            done();
        });
    });

    specify("Immediate value waits for deferred this", function() {
        var t = Promise.delay(1, THIS);
        var t2 = {};
        return Promise.resolve(t2).bind(t).then(function(value) {
            assert.strictEqual(this, THIS);
            assert.strictEqual(t2, value);
        });
    });


    specify("Immediate error waits for deferred this", function() {
        var t = Promise.delay(1, THIS);
        var err = new Error();
        return Promise.reject(err).bind(t).then(assert.fail, function(e) {
            assert.strictEqual(this, THIS);
            assert.strictEqual(err, e);
        });
    });

    function makeThisArgRejectedTest(reason) {
        return function() {
            return Promise.bind(reason()).then(assert.fail, function(e) {
                assert(this === defaultThis);
                assert(e.value === 1);
            })
        };
    }

    specify("if thisArg is rejected timed promise, returned promise is rejected",
        makeThisArgRejectedTest(function() { return timedRejectedPromiseOf(e); }));
    specify("if thisArg is rejected immediate promise, returned promise is rejected",
        makeThisArgRejectedTest(function() { return immediateRejectedPromiseOf(e); }));
    specify("if thisArg is rejected timed thenable, returned promise is rejected",
        makeThisArgRejectedTest(function() { return timedRejectedThenableOf(e); }));
    specify("if thisArg is rejected immediate thenable, returned promise is rejected",
        makeThisArgRejectedTest(function() { return immediateRejectedThenableOf(e); }));

    function makeThisArgRejectedTestMethod(reason) {
        return function() {

            return Promise.resolve().bind(reason()).then(assert.fail, function(e) {
                assert(this === defaultThis);
                assert(e.value === 1);
            })
        };
    }

    specify("if thisArg is rejected timed promise, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return timedRejectedPromiseOf(e); }));
    specify("if thisArg is rejected immediate promise, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return immediateRejectedPromiseOf(e); }));
    specify("if thisArg is rejected timed thenable, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return timedRejectedThenableOf(e); }));
    specify("if thisArg is rejected immediate thenable, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return immediateRejectedThenableOf(e); }));
});

describe("github issue", function() {
    specify("gh-426", function() {
        return Promise.all([Promise.delay(10)]).bind(THIS).spread(function() {
            assert.equal(this, THIS);
        });
    });

    specify("gh-702-1", function() {
        return Promise.bind(Promise.delay(1, THIS)).then(function() {
            assert.equal(this, THIS);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });

    specify("gh-702-2", function() {
        return Promise.resolve().bind(Promise.delay(1, THIS)).then(function() {
            assert.equal(this, THIS);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });
});


describe("promised bind", function() {
    specify("works after following", function() {
        return Promise.bind(Promise.delay(1, THIS)).then(function() {
            assert.equal(this, THIS);
            return Promise.delay(1);
        }).then(function() {
            assert.equal(this, THIS);
            return Promise.delay(1);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });

    specify("works with spread", function() {
        return Promise.bind(Promise.delay(1, THIS), [1,2,3]).spread(function() {
            assert.equal(this, THIS);
            assert.deepEqual([1,2,3], [].slice.call(arguments));
            return Promise.delay(1, [].slice.call(arguments));
        }).spread(function() {
            assert.deepEqual([1,2,3], [].slice.call(arguments));
            assert.equal(this, THIS);
            return Promise.delay(1, [].slice.call(arguments));
        }).spread(function() {
            assert.deepEqual([1,2,3], [].slice.call(arguments));
            assert.equal(this, THIS);
        });
    });

    specify("works with immediate finally", function() {
        return Promise.bind(Promise.delay(1, THIS), [1,2,3]).lastly(function() {
            assert.equal(this, THIS);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });

    specify("works with delayed finally", function() {
        return Promise.bind(Promise.delay(1, THIS), [1,2,3]).lastly(function() {
            assert.equal(this, THIS);
            return Promise.delay(1);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });

    specify("works with immediate tap", function() {
        return Promise.bind(Promise.delay(1, THIS), [1,2,3]).tap(function() {
            assert.equal(this, THIS);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });

    specify("works with delayed tap", function() {
        return Promise.bind(Promise.delay(1, THIS), [1,2,3]).tap(function() {
            assert.equal(this, THIS);
            return Promise.delay(1);
        }).then(function() {
            assert.equal(this, THIS);
        });
    });
});


