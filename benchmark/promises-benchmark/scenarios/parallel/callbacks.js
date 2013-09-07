var utils = require('./utils')


function parallel(xs, f, done) {
  var len    = xs.length
  var result = new Array(len)

  xs.forEach(function(x, i) {
               f(x, function(err, v) {
                      if (err)  done(err)
                      else      { result[i] = v
                                  if (--len == 0) done(null, result) }})})}


module.exports = {
  cached: function(list, done) { return function(deferred) {
    utils.cache = {}
    parallel(list, utils.read, function(err, r){
                                 if (err) throw err
                                 else     done(deferred) }) }}

, naive: function(list, done) { return function(deferred) {
    parallel(list, utils.readFile, function(err, r){
                                     if (err) throw err
                                     done(deferred) })}}
}