"use strict";
module.exports = function(Promise, cast, apiRejection) {
var PromiseReduce = Promise.reduce;

function pushThis(value) {
    this.push(value);
    return this;
}

function each(promises, fn) {
    if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
    var vals = [];
    return PromiseReduce(promises, iterator, vals)
            ._then(pushThis, void 0, void 0, vals, void 0);

    function iterator(prev, value, index, length) {
        var hasPrev = prev !== vals;
        if (hasPrev) vals.push(prev);
        return fn.call(this, value, hasPrev ? prev : void 0 , index, length);
    }
}

Promise.prototype.each = function Promise$each(fn) {
    return each(this, fn);
};

Promise.each = function Promise$Each(promises, fn) {
    return each(promises, fn);
};
};
