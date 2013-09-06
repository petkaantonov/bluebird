//
// This tests a library-provided promise-aware map()
// function, if available.
//

var libs, Test, test, i, array, iterations;

libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

iterations = 10000;

array = [];
for(i = 1; i<iterations; i++) {
	array.push(i);
}

test = new Test('map', iterations);
test.run(Object.keys(libs).filter(function(name) {
	return libs[name].map;
}).map(function(name) {
	return function() {
		return runTest(name, libs[name]);
	};
}));

function runTest(name, lib) {
	var start = Date.now();

	return lib.map(array, function(value) {
		return lib.fulfilled(value * 2);
	})
	.then(function() {
		test.addResult(name, Date.now() - start);
	});
}
