// -- Dependencies -----------------------------------------------------
var fs = require('fs')
var path = require('path')


// -- Helpers ----------------------------------------------------------
function parallel(fs, done) {
  var length  = fs.length
  var results = new Array(length)

  fs.forEach(function(f, i) { f(resolver(i)) })

  function resolver(i){ return function(err, value) {
    if (err)  done(err)
    else      { results[i] = value
                if (--length == 0)  done(null, results) }}}}

function mapSequentially(xs, f, done) {
  var length  = xs.length
  var results = new Array(length)
  var index   = 0

  function next() {
    f(xs[index], function(x) {
                   results[index] = x
                   if (++index >= length)  done(null, results)
                   else                    next() })}

  next() }

function concatenate(xs, done) {
  done( null
      , xs.reduce( function(as, bs) { return as.concat(bs) }
                  , [] ))}


function join(xs, separator, done) {
  done( null
      , xs.join(separator)) }


function withParent(dir){ return function(file) {
  return path.join(dir, file) }}


function isString(a) {
  return typeof a === 'string' }


// -- Generators -------------------------------------------------------
function noiseList(n){ return function(done) {
  done( null
      , n <= 0?  []
      : /* _ */  Array(n + 1).join(0)
                             .split(0)
                             .map(function(_, i){ return i })) }}

function read(filename, done) {
  return isString(filename)?  fs.lstat(filename, done)
  :      /* otherwise */      done(null, String(filename)) }

function readFiles(dir) { return function(done) {
  fs.readdir(dir, function(err, files) {
                    if (err)  done(err)
                    else      done(null, files.map(withParent(dir))) })}}


function makeLists(dir, noiseFactor, done) {
  parallel([ noiseList(noiseFactor)
           , readFiles(dir)
           ], done )}

function readAll(xs, done) {
  mapSequentially(xs, read, done) }

// -- Core -------------------------------------------------------------
module.exports = function(dir, noiseFactor, done){ return function(deferred) {

  makeLists(dir, noiseFactor, function(err, items) {
    concatenate(items, function(err, files) {
      readAll(files, function(err, texts) {
          done(deferred, err, texts) })})})

}}