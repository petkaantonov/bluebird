
var co = require('co');

var f = require('./dummy');

var makefakes = require('./fakemaker');

// Continuable versions made with co.wrap
function dummyC(n) {
    return co.wrap(f.dummy(n));
}
function dummytC(n) {
    return co.wrap(f.dummyt(n));
}

makefakes(dummyC, dummytC, co.wrap);


