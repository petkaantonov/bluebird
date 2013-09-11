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
    //It actually makes no sense to use the promises' .map
    //if you are going to map a bunch of integers... there is
    //[].map for that
    var a = array.map(function(v){
        return lib.fulfilled(v);
    });
    var last = a[a.length-1];
    var ret = lib.pending();
    last.then(function(){
        var start = Date.now();

        lib.map(a, function(value) {
            return lib.fulfilled(value * 2);
        })
        .then(function(a) {
            test.addResult(name, Date.now() - start);
            ret.fulfill(a);
        });
    });
    return ret.promise;
}