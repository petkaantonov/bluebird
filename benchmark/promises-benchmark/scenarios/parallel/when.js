var when = require('when')

var listTest = require('./promises')(function(f) {
                                       var d = when.defer()
                                       f(d.resolve, d.reject)
                                       return d.promise })

function raise(e){ process.nextTick(function(){ throw e })}

module.exports = function(list){ return function(deferred) {
  return listTest(list)
           .then(function(v){ deferred.resolve() })
           .otherwise(raise)
}}