//
// Performance of raw deferred creation speed.
//
// This test DOES NOT care about when all the promises
// have actually resolved (e.g. Q promises always resolve in a
// future turn).  This is a pure, brute force sync code test.
//
// Note: it appears as if unresolved deferred()s prevent the
// process from exiting when execution reaches the end of this
// file, hence the process.exit().
// It's not clear at this time whether that is the intended
// behavior or not, but it does not appear to affect the test
// results.
//

var libs, Test, test, when, q, JQDeferred, deferred, d, i, start, iterations;


libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

iterations = 10000;
var parallelism = 1000;
test = new Test('defer-create', iterations, parallelism);

test.run(Object.keys(libs).map(function(name) {
    return function() {
        return runTest(name, libs[name]);
    };
}), true);

function runTest(name, lib) {
    var start;

    for(i = 0; i<iterations; i++) {
        lib.pending();
    }

    start = Date.now();
    var memNow = Test.memNow();
    for( var j = 0; j < parallelism; ++j ) {
        for(i = 0; i<iterations; i++) {
            lib.pending();
        }
    }

    test.addResult(name, Date.now() - start, Test.memDiff(memNow));
    return lib.fulfilled();
}
