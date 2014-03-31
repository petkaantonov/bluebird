"use strict";
module.exports = function(Promise, Promise$_CreatePromiseArray) {
var SomePromiseArray = Promise._SomePromiseArray;
var ASSERT = require("./assert.js");

function Promise$_Any(promises, useBound) {
    var ret = Promise$_CreatePromiseArray(
        promises,
        SomePromiseArray,
        useBound === USE_BOUND && promises._isBound()
            ? promises._boundTo
            : void 0
   );
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

Promise.any = function Promise$Any(promises) {
    return Promise$_Any(promises, DONT_USE_BOUND);
};

Promise.prototype.any = function Promise$any() {
    return Promise$_Any(this, USE_BOUND);
};

};
