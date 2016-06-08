"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
var ASSERT = require("./assert");

function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ASSERT(promise.isPending());
    ASSERT(ret instanceof SomePromiseArray);
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};
