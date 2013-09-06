//
// Performance of raw deferred creation and resolution speed.
// It creates a large number of deferreds, registers a handler
// with each, and then resolves each immediately.
//
// This test DOES NOT care about when all the promises
// have actually resolved (e.g. Q promises always resolve in a
// future turn).  This is a pure, brute force sync code test.
//

var libs, Test, test, when, q, JQDeferred, deferred, d, i, start, iterations;

libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

iterations = 10000;
test = new Test('defer-reject', iterations);

for(var lib in libs) {
	runTest(lib, libs[lib].pending);
}

test.report();

function runTest(name, createDeferred) {
	var start, d;

	start = Date.now();
	for(i = 0; i<iterations; i++) {
		d = createDeferred();
		d.promise.then(addOne);
		d.reject(i);
	}

	test.addResult(name, Date.now() - start);
}

function addOne(x) {
	return x + 1;
}
