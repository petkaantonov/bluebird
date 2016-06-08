"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


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
        }, 1)
    }
    else {
        fn(value);
    }

};

function testFulfillSync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1), new Thenable(2), new Thenable(3)];

    specify("Promise." + name + " thenables that fulfill synchronously", function(){
        return cb(Promise[name](thenables, a1, a2, a3));
    });

}

function testFulfillAsync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, true), new Thenable(2, true), new Thenable(3, true)];

    specify("Promise." + name + " thenables that fulfill asynchronously", function(){
        return cb(Promise[name](thenables, a1, a2, a3));
    });
}

function testRejectSync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, false, true), new Thenable(2, false, true), new Thenable(3, false, true)];

    specify("Promise." + name + " thenables that reject synchronously", function(){
        return cb(Promise[name](thenables, a1, a2, a3));
    });

}

function testRejectAsync(name, cb, a1, a2, a3) {
    var thenables = [new Thenable(1, true, true), new Thenable(2, true, true), new Thenable(3, true, true)];

    specify("Promise." + name + " thenables that reject asynchronously", function(){
        return cb(Promise[name](thenables, a1, a2, a3));
    });
}


describe("Using collection methods with thenables", function() {
    var name = "race";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert(v === 1);
        });
    });
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v === 1);
        });
    });
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v === 1);
        });
    });
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v === 1);
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "all";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
        });
    });
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
        });
    });
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v === 1);
        });
    });
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v === 1);
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "settle";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v) {
            assert(v[0].value() === 1)
            assert(v[1].value() === 2)
            assert(v[2].value() === 3)
        });
    });
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0].value() === 1)
            assert(v[1].value() === 2)
            assert(v[2].value() === 3)
        });
    });
    testRejectSync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0].error() === 1)
            assert(v[1].error() === 2)
            assert(v[2].error() === 3)
        });
    });
    testRejectAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0].error() === 1)
            assert(v[1].error() === 2)
            assert(v[2].error() === 3)
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "any";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert(v === 1);
        });
    });
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v === 1);
        });
    });
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
        });
    });
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
        });
    });
});

describe("Using collection methods with thenables", function() {
    var name = "some";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0] === 1);
        });
    }, 1);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0] === 1);
        });
    }, 1);
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
        });
    }, 1);
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert(v[0] === 1);
            assert(v[1] === 2);
            assert(v[2] === 3);
        });
    }, 1);
});

describe("Using collection methods with thenables", function() {
    var name = "join";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
        });
    }, 1, 2, 3);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
        });
    }, 1, 2, 3);
    testRejectSync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
        });
    }, 1, 2, 3);
    testRejectAsync(name, function(promise) {
        return promise.then(function(v){
            assert(v[0][0].value === 1);
            assert(v[0][1].value === 2);
            assert(v[0][2].value === 3);
            assert(v[1] === 1);
            assert(v[2] === 2);
            assert(v[3] === 3);
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
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [2,4,6]);
        });
    }, mapper);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [2,4,6]);
        });
    }, mapper);
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, mapper);
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, mapper);
});

describe("Using collection methods with thenables", function() {
    var name = "reduce";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, 6);
        });
    }, reducer);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, 6);
        });
    }, reducer);
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, reducer);
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, reducer);
});

describe("Using collection methods with thenables", function() {
    var name = "filter";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
        });
    }, filterer);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, [1,2,3]);
        });
    }, filterer);
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, filterer);
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, filterer);
});

describe("Using collection methods with thenables", function() {
    var name = "props";
    testFulfillSync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, {0: 1, 1: 2, 2: 3});
        });
    }, filterer);
    testFulfillAsync(name, function(promise) {
        return promise.then(function(v){
            assert.deepEqual(v, {0: 1, 1: 2, 2: 3});
        });
    }, filterer);
    testRejectSync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, filterer);
    testRejectAsync(name, function(promise) {
        return promise.then(assert.fail, function(v){
            assert.deepEqual(v, 1);
        });
    }, filterer);
});
