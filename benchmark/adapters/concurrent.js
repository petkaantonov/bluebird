var concurrent = require('concurrent');
var Future = concurrent.Future;
var collections = concurrent.collections;

exports.pending = function() {
  var promise = new Future();
  
  return {
    promise: promise,
    fulfill: function(value) {
      promise.fulfill(value);
    },
    reject: function(reason) {
      promise.reject(reason);
    }
  };
};

exports.fulfilled = Future.fulfilled;
exports.rejected = Future.rejected;

exports.map = collections.map;
exports.reduce = collections.reduce;
