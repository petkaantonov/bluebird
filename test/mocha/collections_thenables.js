"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

function Thenable(value, defer, reject) {
    this.value = value;
    this.defer = !!defer;
    this.reject = !!reject;
}

Thenable.prototype.then = function Then$then(onFulfilled, onRejected) {
    var fn = this.reject ? onRejected : onFulfilled;
    var value = this.value;

    if (this.defer) {
        setTimeout(function(){
            fn(value);
        }, 40)
    }
    else {
        fn(value);
    }

};

function testFulfillSync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1), new Thenable(2), new Thenable(3)];

    specify("Promise." + name + " thenables that fulfill synchronously", function(done){
        cb(Promise[name](thenables, a1, a2, a3), done);
    });

}

function testFulfillAsync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, true), new Thenable(2, true), new Thenable(3, true)];

    specify("Promise." + name + " thenables that fulfill asynchronously", function(done){
        cb(Promise[name](thenables, a1, a2, a3), done);
    });
}

function testRejectSync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, false, true), new Thenable(2, false, true), new Thenable(3, false, true)];

    specify("Promise." + name + " thenables that reject synchronously", function(done){
        cb(Promise[name](thenables, a1, a2, a3), done);
    });

}

function testRejectAsync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, true, true), new Thenable(2, true, true), new Thenable(3, true, true)];

    specify("Promise." + name + " thenables that reject asynchronously", function(done){
        cb(Promise[name](thenables, a1, a2, a3), done);
    });
}


describe("Using collection methods with thenables", function() {
    var name = "race";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v === 1);
            done();
        });
    });
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v === 1);
            done();
        });
    });
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v === 1);
            done();
        });
    });
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v === 1);
            done();
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "all";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
            done();
        });
    });
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
            done();
        });
    });
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v === 1);
            done();
        });
    });
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v === 1);
            done();
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "settle";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v) {
            assert(v[0].value() === 1)
            assert(v[1].value() === 2)
            assert(v[2].value() === 3)
            done();
        });
    });
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0].value() === 1)
            assert(v[1].value() === 2)
            assert(v[2].value() === 3)
            done();
        });
    });
    testRejectSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0].error() === 1)
            assert(v[1].error() === 2)
            assert(v[2].error() === 3)
            done();
        });
    });
    testRejectAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0].error() === 1)
            assert(v[1].error() === 2)
            assert(v[2].error() === 3)
            done();
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "any";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v === 1);
            done();
        });
    });
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v === 1);
            done();
        });
    });
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
            done();
        });
    });
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
            done();
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "some";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0] === 1);
            done();
        });
    }, 1);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0] === 1);
            done();
        });
    }, 1);
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
            done();
        });
    }, 1);
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
            done();
        });
    }, 1);
});

describe("Using collection methods with thenables", function() {
    var name = "join";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
            done();
        });
    }, 1, 2, 3);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
            done();
        });
    }, 1, 2, 3);
    testRejectSync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
            done();
        });
    }, 1, 2, 3);
    testRejectAsync(name, function(promise, done) {
        promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
            done();
        });
    }, 1, 2, 3);
});

function mapper(v) {
    return {
        then: function(f) {
            f(v*2);
        }
    };
}
function reducer(a, b) {
    return a + b;
}
function filterer(v) {
    return {
        then: function(f) {
            f(v > 0);
        }
    };
}

describe("Using collection methods with thenables", function() {
    var name = "map";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [2,4,6]);
            done();
        });
    }, mapper);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [2,4,6]);
            done();
        });
    }, mapper);
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, mapper);
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, mapper);
});

describe("Using collection methods with thenables", function() {
    var name = "reduce";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, 6);
            done();
        });
    }, reducer);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, 6);
            done();
        });
    }, reducer);
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, reducer);
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, reducer);
});

describe("Using collection methods with thenables", function() {
    var name = "filter";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
            done();
        });
    }, filterer);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
            done();
        });
    }, filterer);
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, filterer);
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, filterer);
});

describe("Using collection methods with thenables", function() {
    var name = "props";
    testFulfillSync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, {0: 1, 1: 2, 2: 3});
            done();
        });
    }, filterer);
    testFulfillAsync(name, function(promise, done) {
        promise.then(function(v){
            assert.deepEqual(v, {0: 1, 1: 2, 2: 3});
            done();
        });
    }, filterer);
    testRejectSync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, filterer);
    testRejectAsync(name, function(promise, done) {
        promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
            done();
        });
    }, filterer);
});
