"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.mapSeries = Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.mapSeries = Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
};
};
