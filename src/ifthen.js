"use strict";
module.exports = function(Promise) {
Promise.prototype.ifthen =
function Promise$ifthen(condition, didFullfill, didReject, didProgress) {
    if (condition) {
        return this._then(didFullfill, didReject, didProgress, void 0, void 0);
    }
    return this;
};
};
