var promise = require('../lib/lie');
var promisesAplusTests = require("promises-aplus-tests");
var adapter = {};
//based off rsvp's adapter
adapter.pending = function () {
  var pending = {};

  pending.promise = new promise(function(resolve, reject) {
    pending.fulfill = resolve;
    pending.reject = reject;
  });

  return pending;
};
module.exports = function(callback){
    promisesAplusTests(adapter, { reporter: "nyan" }, callback);
};