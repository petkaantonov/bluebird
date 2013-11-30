"use strict";
module.exports = function(Promise) {
    var PromiseInspection = require("./promise_inspection.js");

    Promise.prototype.inspect = function Promise$inspect() {
        return new PromiseInspection(this);
    };
};
