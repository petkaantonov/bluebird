"use strict";
module.exports = function(Promise, INTERNAL) {
    var apiRejection = require("./errors_api_rejection.js")(Promise);
    var isArray = require("./util.js").isArray;

    function raceLater(promise, caller) {
        return promise.then(function(array) {
            return Promise$_Race(array, caller, promise);
        });
    }

    var hasOwn = {}.hasOwnProperty;
    function Promise$_Race(promises, caller, parent) {
        var maybePromise = Promise._cast(promises, caller, void 0);

        if (Promise.is(maybePromise)) {
            return raceLater(maybePromise, caller);
        }
        else if (!isArray(promises)) {
            return apiRejection(COLLECTION_ERROR);
        }

        var ret = new Promise(INTERNAL);
        ret._setTrace(caller, parent);
        if (parent !== void 0) {
            ret._setBoundTo(parent._boundTo);
        }
        var fulfill = ret._fulfill;
        var reject = ret._reject;
        for( var i = 0, len = promises.length; i < len; ++i ) {
            var val = promises[i];

            if (val === void 0 && !(hasOwn.call(promises, i))) {
                continue;
            }

            Promise.cast(val)._then(
                fulfill,
                reject,
                void 0,
                ret,
                null,
                caller
            );
        }
        //Yes, if promises were empty, it will be forever pending :-)
        return ret;
    }

    Promise.race = function Promise$Race( promises ) {
        return Promise$_Race(promises, Promise.race, void 0);
    };

    Promise.prototype.race = function Promise$race() {
        return Promise$_Race(this, this.race, void 0);
    };

};
