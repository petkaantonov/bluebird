"use strict";
module.exports = function(Promise) {
var apiRejection = require("./errors_api_rejection.js")(Promise);
Promise.prototype.call = function Promise$call(fn) {
    if (typeof fn !== "function") return apiRejection(NOT_FUNCTION_ERROR);
    INLINE_SLICE(args, arguments, 1);

    return this.then(function(arg) {
        args.push(arg);
        return fn.apply(this, args);
    });
};

function Promise$getter(obj) {
    var prop = typeof this === "string"
        ? this
        : ("" + this);
    return obj[prop];
}
Promise.prototype.get = function Promise$get(propertyName) {
    return this._then(
        Promise$getter,
        void 0,
        void 0,
        propertyName,
        void 0
   );
};
};
