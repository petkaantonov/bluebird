
if (global.useQ)
    var lifter = require('q').denodeify;
else if( global.useBluebird ) {
    //Currently promisifies only Node style callbacks
    var lifter = require('../../../js/bluebird.js').promisify;
}else {
    var lifter = require('when/node/function').lift
}


var f = require('./dummy');

var makefakes = require('./fakemaker');

// A function taking n values or promises and returning
// a promise
function dummyP(n) {
    return lifter(f.dummy(n));
}

// Throwing version of above
function dummytP(n) {
    return lifter(f.dummyt(n));
}

makefakes(dummyP, dummytP, lifter);

