"use strict";
var Promise = require("./promise").Promise;

function resolve(thenable) {
  return new Promise(function(resolve, reject) {
    resolve(thenable);
  });
}


exports.resolve = resolve;