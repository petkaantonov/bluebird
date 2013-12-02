"use strict";
module.exports = function(Promise, Promise$_All, PromiseArray) {

    var SomePromiseArray = require("./some_promise_array.js")(PromiseArray);
    var ASSERT = require("./assert.js");

    function Promise$_Any(promises, useBound, caller) {
        var ret = Promise$_All(
            promises,
            SomePromiseArray,
            caller,
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
        return Promise$_Any(promises, DONT_USE_BOUND, Promise.any);
    };

    Promise.prototype.any = function Promise$any() {
        return Promise$_Any(this, USE_BOUND, this.any);
    };

};
