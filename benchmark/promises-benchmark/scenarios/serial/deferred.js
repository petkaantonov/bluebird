var deferred = require('deferred')

var listTest = require('./promises')(function(f) {
                                       var d = deferred()
                                       f(d.resolve, d.reject)
                                       return d.promise })

function raise(e) { process.nextTick(function(){ throw e }) }

module.exports = function(path, noiseFactor){ return function(deferred) {
  return listTest(path, noiseFactor)
           .then(function(v){ deferred.resolve() }
                ,raise)
}}