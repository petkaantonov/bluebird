"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
var ASSERT = require("./assert.js");

function Promise$_Any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    if (promise.isRejected()) {
        return promise;
    }
    ASSERT(ret instanceof SomePromiseArray);
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return Promise$_Any(promises);
};

Promise.prototype.any = function () {
    return Promise$_Any(this);
};

};
