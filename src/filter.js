"use strict";
module.exports = function(Promise, apiRejection) {
var PromiseMap = Promise._map;
function filterer(booleans) {
    var values = this;
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    return ret;
}

function filter(promises, fn, receiver) {
    if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
    var promiseArray = PromiseMap(promises, fn, receiver, true);
    var preservedValues = promiseArray.preservedValues();
    return promiseArray
            .promise()
            ._then(filterer, void 0, void 0, preservedValues, void 0);
}

Promise.prototype.filter = function Promise$filter(fn) {
    return filter(this, fn, this._boundTo);
};

Promise.filter = function Promise$Filter(promises, fn) {
    return filter(promises, fn, void 0);
};
};
