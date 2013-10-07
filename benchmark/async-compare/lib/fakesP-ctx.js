var timers = require('./timers-ctx');

var fakemaker = require('./fakemaker');

var f = {};
f.dummy = function dummy(n) {
    return function dummy_n() {
        var cb = arguments[n - 1],
            ctx = arguments[n];
        timers.setTimeout(cb, ctx, global.asyncTime || 100);
    }
}

// A throwing callback function
f.dummyt = function dummyt(n) {
    return function dummy_throwing_n() {
        var cb = arguments[n - 1],
            ctx = arguments[n];
        if (global.testThrow) 
            throw(new Error("Exception happened"));
        setTimeout(function throwTimeout() {
            if (global.testThrowAsync) {
                throw(new Error("Exception happened"));
            } else if (global.testError) {
                return cb.call(ctx, new Error("Error happened"));
            }
            else cb.call(ctx);
        }, global.asyncTime || 100);
    }
}



//Currently promisifies only Node style callbacks
//var lifter = require('bluebird').promisify;

var Promise = require('bluebird');

function nodeback(err, result) {
    if (err == null) this.fulfill(result);
    else this.reject(err);
}

function lifter(f) {
    return function lifted(a1, a2, a3, a4, a5) {
        "use strict";
        var len = arguments.length;
        var deferred = Promise.pending();
        try {
            switch(len) {
                case 1: f(a1, nodeback, deferred); break;
                case 2: f(a1, a2, nodeback, deferred); break;
                case 0: f(nodeback, deferred); break;
                case 3: f(a1, a2, a3, nodeback, deferred); break;
                case 4: f(a1, a2, a3, a4, nodeback, deferred); break;
                case 5: f(a1, a2, a3, a4, a5, nodeback, deferred); break;
            }
        } catch (err) { deferred.reject(err); }
        return deferred.promise;
    }
}

// A function taking n values or promises and returning 
// a promise
function dummyP(n) {    
    return function lifted() {
        var deferred = Promise.pending();
        timers.setTimeout(nodeback, deferred, global.asyncTime || 100);
        return deferred.promise;
    }
}

// Throwing version of above
function dummytP(n) {
    return lifter(f.dummyt(n));
}

fakemaker(dummyP, dummytP, lifter);

