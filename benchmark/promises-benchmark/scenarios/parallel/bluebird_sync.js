var Promise       = require('../../../../js/bluebird_sync.js')
var listTest = require('./promises')(function(f) {

    var d = Promise.pending();
    f(function(a){
        d.fulfill(a);
    }, function(a) {
        d.reject(a);
    });
    return d.promise;

});


module.exports = function(list) { return function(deferred) {
  return listTest(list)
           .then(function(v){
                   deferred.resolve() })
}}