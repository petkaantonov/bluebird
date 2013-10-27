//
// Performance of large number of *deferred* promises chained together
// to compute a final result.  Promises will resolve sequentially
// with no overlap.
//
// Note that jQuery.Deferred.then() is not fully Promises/A compliant
// and so will not compute the correct result.  This is known,
// and should not be a factor in the performance characteristics
// of this test.
//

var libs, Test, test, i, array, iterations;

var all = require("../../js/main/bluebird.js").all;
libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

var parallelism = 10;
iterations = 10000;

array = [];
for(i = 1; i<iterations; i++) {
    array.push(i);
}

test = new Test('defer-sequence', iterations, parallelism);

test.run(Object.keys(libs).map(function mapper(name) {
    return function returned() {
        return runTest(name, libs[name]);
    };
}));

function runTest(name, lib) {
    var start, d;

    d = lib.pending();
    d.fulfill(0);

    var ret = lib.pending();

    // Use reduce to chain <iteration> number of promises back
    // to back.  The final result will only be computed after
    // all promises have resolved
    array.reduce(function outer(promise, nextVal) {
        return promise.then(function inner(currentVal) {
            // Uncomment if you want progress indication:
            //if(nextVal % 1000 === 0) console.log(name, nextVal);
            var d = lib.pending();
            d.fulfill(currentVal + nextVal);
            return d.promise;
        });
    }, d.promise).then(function(){
        var promises = new Array(parallelism);

        d = lib.pending();
        d.fulfill(0);

        // Start timer
        start = Date.now();
        var memNow = Test.memNow();
        // Use reduce to chain <iteration> number of promises back
        // to back.  The final result will only be computed after
        // all promises have resolved
        for( var j = 0; j < parallelism; ++j ) {
            promises[j] = array.reduce(function outer(promise, nextVal) {
                return promise.then(function inner(currentVal) {
                    // Uncomment if you want progress indication:
                    //if(nextVal % 1000 === 0) console.log(name, nextVal);
                    var d = lib.pending();
                    d.fulfill(currentVal + nextVal);
                    return d.promise;
                });
            }, d.promise);
        }

        all(promises).then(function result() {
            test.addResult(name, Date.now() - start, Test.memDiff(memNow));
            ret.fulfill();
        });

    });

    return ret.promise;
}
