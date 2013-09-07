var co    = require('co')
var fs    = require('fs')
var cache = {}


var readFile = co.wrap(fs.readFile)

function *read(name) {
  return name in cache?   cache[name]
  :      /* otherwise */  cache[name] = yield readFile(name) }


module.exports = function(list, done) { return function(deferred) {
  cache      = {}

  co(function *() {
    var values = yield list.map(read)
    deferred.resolve() })}}
