var promise = require('../lib/lie');
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
adapter.rejected = function(reason){
      return promise(function(){
          throw reason;
      });
  };
module.exports = adapter;