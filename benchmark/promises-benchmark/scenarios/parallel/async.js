var async = require('async')
var utils = require('./utils')

module.exports = {
  cached: function(list, done) { return function(deferred) {
    utils.cache = {}
    async.map(list, utils.read, function(err, r){
                                  if (err) throw err
                                  else     done(deferred) }) }}

, naive: function(list, done) { return function(deferred) {
    async.map(list, utils.readFile, function(err, r){
                                      if (err) throw err
                                      done(deferred) })}}
}
