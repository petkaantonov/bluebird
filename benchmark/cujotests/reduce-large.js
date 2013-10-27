//
// This tests a library-provided promise-aware reduce()
// function, if available.
//
// Note that in my environment, using node v0.8.14, deferred.reduce
// causes a stack overflow for an array length >= 610.
//

var libs, Test, test, i, array, expected, iterations;

var all = require("../../js/main/bluebird.js").all;
libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

var parallelism = 1000;
iterations = 10000;

array = [];
expected = 0;

for(i = 1; i<iterations; i++) {
    expected += i;
    array.push(i);
}

test = new Test('reduce-large', iterations, parallelism,
    'NOTE: in node v0.8.14, deferred.reduce causes a\nstack overflow for an array length >= 610'
);
test.run(Object.keys(libs).filter(function(name) {
    if( name === "deferred" ) return false;
    return libs[name].reduce;
}).map(function(name) {
    return function() {
        return runTest(name, libs[name]);
    };
}));

function runTest(name, lib) {
    //It actually makes no sense to use the promises' .reduce
    //if you are going to reduce a bunch of integers... there is
    //[].reduce for that
    var a = array.map(function(v){
        return lib.fulfilled(v);
    });
    var last = a[a.length-1];
    var ret = lib.pending();
    last.then(function () {
        lib.reduce(a, function (current, next) {
            return lib.fulfilled(current + next);
        }, lib.fulfilled(0)).then(function () {

            var promises = new Array( parallelism );

            var start = Date.now();
            var memNow = Test.memNow();

            for( var j = 0; j < parallelism; ++j ) {
                promises[j] = lib.reduce(a, function (current, next) {
                    return lib.fulfilled(current + next);
                }, lib.fulfilled(0));
            }

            all(promises).then(function (result) {
                test.addResult(name, Date.now() - start, Test.memDiff(memNow));
                ret.fulfill(result);
            });
        });
    });
    return ret.promise;
}
