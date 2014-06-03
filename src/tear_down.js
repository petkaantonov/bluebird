"use strict";
module.exports = function(Promise) {

Promise.prototype.tearDown =
function Promise$tearDown(callback) {
    this._tearDownResolver = callback;
    return this;
};

Promise.prototype._tearDown =
function Promise$_tearDown() {
    if (this._tearDownResolver) {
        this._tearDownResolver.call(this._boundTo);
    }

    if (this._parent) {
        this._parent._tearDown();
    }
};

};
