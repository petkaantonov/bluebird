// -- Dependencies -----------------------------------------------------
var fs = require('fs')
var path = require('path')
var co = require('co')


// -- Helpers ----------------------------------------------------------
function parallel(fs){ return function(done) {
  var length  = fs.length
  var results = new Array(length)

  fs.forEach(function(f, i) { f(resolver(i)) })

  function resolver(i){ return function(err, value) {
    if (err)  done(err)
    else      { results[i] = value
                if (--length == 0)  done(null, results) }}}}}


function *mapSequentially(xs, f){
  var length  = xs.length
  var results = new Array(length)
  for (var i = 0; i < length; ++i)
    results[i] = yield f(xs[i])

  return results }


function concatenate(xs){
  return xs.reduce( function(as, bs) { return as.concat(bs) }
                  , [] )}


function withParent(dir){ return function(file) {
  return path.join(dir, file) }}


function isString(a) {
  return typeof a === 'string' }


// -- Generators -------------------------------------------------------
function noiseList(n){
  return n <= 0?  []
  :      /* _ */  Array(n + 1).join(0)
                              .split(0)
                              .map(function(_, i){ return i }) }

var readFile = co.wrap(fs.readFile)
var readDir  = co.wrap(fs.readdir)
var lstat    = co.wrap(fs.lstat)

function *read(filename) {
  return isString(filename)?  yield lstat(filename)
  :      /* otherwise */      String(filename) }


function *readFiles(dir) {
  var files = yield readDir(dir)
  return files.map(withParent(dir)) }


function *readAll(xs) {
  return yield mapSequentially(xs, read) }

// -- Core -------------------------------------------------------------
module.exports = function(dir, noiseFactor){ return function(deferred) {

  co(function *() {
    var noise     = noiseList(noiseFactor)
    var files     = yield readFiles(dir)
    var wholeList = yield readAll(concatenate([noise, files]))

    deferred.resolve(wholeList)
  })

}}
