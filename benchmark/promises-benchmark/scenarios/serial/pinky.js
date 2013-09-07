var pinky = require('pinky')

var listTest = require('./promises')(function(f) {
                                       var p = pinky()
                                       f(p.fulfill, p.reject)
                                       return p })

function raise(e) {
  process.nextTick(function(){ throw e })}


module.exports = function(path, noiseFactor) { return function(deferred) {
  return listTest(path, noiseFactor)
           .then(function(v) { deferred.resolve() })
           .otherwise(raise)
}}