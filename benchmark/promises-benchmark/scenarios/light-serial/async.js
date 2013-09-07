// -- Dependencies -----------------------------------------------------
var fs = require('fs')
var path = require('path')
var async = require('async')


// -- Helpers ----------------------------------------------------------
function concatenate(xs, done) {
  done( null
      , xs.reduce( function(as, bs) { return as.concat(bs) }
                  , [] ))}


function join(separator){ return function(xs, done) {
  done( null
      , xs.join(separator)) }}


function withParent(dir){ return function(file) {
  return path.join(dir, file) }}


function isString(a) {
  return typeof a === 'string' }


// -- Generators -------------------------------------------------------
function noiseList(n) { return function(done) {
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


function makeLists(dir, noiseFactor) { return function(done) {
  async.parallel([ noiseList(noiseFactor)
                 , readFiles(dir)
                 ]
                , done )}}


function readAll(xs, done) {
  return async.mapSeries(xs, read, done) }


// -- Core -------------------------------------------------------------
module.exports = function(dir, noiseFactor, done) { return function(deferred) {

  async.waterfall([ makeLists(dir, noiseFactor)
                  , concatenate
                  , readAll
                  ]
                 , function(err, results) {
                     done(deferred, err, results) })

}}