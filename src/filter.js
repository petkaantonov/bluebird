"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function Promise$filter(fn) {
    return PromiseMap(this, fn, INTERNAL);
};

Promise.filter = function Promise$Filter(promises, fn) {
    return PromiseMap(promises, fn, INTERNAL);
};
};
