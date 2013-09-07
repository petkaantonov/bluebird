var q        = require('q')
var listTest = require('./promises')(function(f) {
                                       var d = q.defer()
                                       f(d.resolve, d.reject)
                                       return d.promise })

module.exports = function(list) { return function(deferred) {
  return listTest(list)
           .then(function(v){
                   deferred.resolve() })
           .done()
}}