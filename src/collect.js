"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = require("./util");

var collectLater = function (promise) {
    return promise.then(function(array) {
        return collect(array, promise);
    });
};

function collect(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return collectLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection(COLLECTION_ERROR + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, PROPAGATE_ALL);
    }
    // collected values
    var values = [];
    // how many values left to collect
    var promisesLeft = promises.length;
    function checkFinished() {
        if (promisesLeft <= 0) {
            // all promises collected; return values (even if empty)
            ret._fulfill(values);
        }
    }

    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(function (value) {
            // add value to collected array
            values.push(value);
            promisesLeft--;
            checkFinished();
        }, function (reason) {
            promisesLeft--;
            checkFinished();
        }, undefined, ret, null);
    }
    // if promises were empty, resolve with empty array
    checkFinished();
    return ret;
}

Promise.collect = function (promises) {
    return collect(promises, undefined);
};

Promise.prototype.collect = function () {
    return collect(this, undefined);
};

};
