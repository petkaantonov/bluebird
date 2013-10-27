//
// This tests a library-provided promise-aware map()
// function, if available.
//

var libs, Test, test, i, array, iterations;

var all = require("../../js/main/bluebird.js").all;
libs = require('../cujodep/libs.js');
Test = require('../cujodep/test.js');

var parallelism = 1000;
iterations = 10000;

array = [];
for(i = 1; i<iterations; i++) {
    array.push(i);
}

test = new Test('map', iterations, parallelism);
test.run(Object.keys(libs).filter(function(name) {
    return libs[name].map;
}).map(function(name) {
    return function() {
        return runTest(name, libs[name]);
    };
}));

function runTest(name, lib) {
    //It actually makes no sense to use the promises' .map
    //if you are going to map a bunch of integers... there is
    //[].map for that
    var a = array.map(function(v){
        return lib.fulfilled(v);
    });
    var last = a[a.length-1];
    var ret = lib.pending();
    last.then(function () {
        lib.map(a, function (value) {
            return lib.fulfilled(value * 2);
        }).then(function () {
            var promises = new Array(parallelism);

            var start = Date.now();
            var memNow = Test.memNow();

            for( var j = 0; j < parallelism; ++j ) {
                promises[j] = lib.map(a, function (value) {
                    return lib.fulfilled(value * 2);
                });
            }

            all(promises).then(function (a) {
                test.addResult(name, Date.now() - start, Test.memDiff(memNow));
                ret.fulfill(a);
            });
        });
    });
    return ret.promise;
}
