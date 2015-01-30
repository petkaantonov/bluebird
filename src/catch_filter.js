"use strict";
module.exports = function() {
var util = require("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundTo;
        for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];
            var itemIsErrorType = item === Error ||
                (item != null && item.prototype instanceof Error);

            if (itemIsErrorType && e instanceof item) {
                return tryCatch(cb).call(boundTo, e);
            } else if (typeof item === "function" && !itemIsErrorType) {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            }
        }
        errorObj.e = e;
        return errorObj;
    };
}

return catchFilter;
};
