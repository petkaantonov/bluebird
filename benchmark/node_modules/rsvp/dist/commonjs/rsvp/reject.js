"use strict";
var Promise = require("./promise").Promise;

function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}


exports.reject = reject;