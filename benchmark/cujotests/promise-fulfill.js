//
// Performance of raw promise creation speed.  If the library
// provides a lighter weight way to create a resolved promise
// instead of a deferred, it's used here.
//
// This test DOES NOT care about when all the promises
// have actually resolved (e.g. Q promises always resolve in a
// future turn).  This is a pure, brute force sync code test.
//

var libs, Test, test, iterations;

libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

iterations = 10000;
test = new Test('promise-fulfill', iterations);

for(var lib in libs) {
    runTest(lib, libs[lib].fulfilled);
}

test.report();

function runTest(name, createPromise) {
    var start, i;

    for(i = 0; i<iterations; i++) {
        createPromise(i);
    }

    start = Date.now();
    for(i = 0; i<iterations; i++) {
        createPromise(i);
    }

    test.addResult(name,  Math.max(Date.now() - start, 0.01));
}
