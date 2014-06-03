"use strict";
module.exports = function(Promise) {

Promise.prototype.tearDown =
function Promise$tearDown(callback) {
  callback();
  return this;
};

};
