// -- Dependencies -----------------------------------------------------
var fs       = require('fs')
var compose  = require('athena').compose
var joinPath = require('path').join


// -- Core module ------------------------------------------------------
module.exports = function(promise) {

  // -- General helpers ------------------------------------------------

  // :: Arraylike -> Array
  var toArray = Function.call.bind([].slice)

  // :: A -> Bool
  function isString(a) {
    return typeof a === 'string' }


  // -- Promise Helpers ------------------------------------------------
  //
  // These will be provided by a promise utility library, so shouldn't
  // really be considered when comparing the complexity of the
  // overall implementation.


  // :: A -> Bool
  function isPromise(a) {
    return a
    &&     typeof a.then === 'function' }


  // :: A -> Promise () A
  // :: Promise Error A -> Promise () A
  function promiseFrom(a) {
    return isPromise(a)?    a
    :      /* otherwise */  promise(function(resolve){ resolve(a) })}


  // :: [Promise Error A] -> Promise Error [A]
  function all(args) {
    return promise(function(resolve, reject) {
                     var length = args.length
                     var result = new Array(length)
                     args.map(promiseFrom).forEach(resolvePromise)

                     function resolvePromise(p, i) {
                       p.then( function(value) {
                                 result[i] = value
                                 if (--length == 0)  resolve(result) }

                             , reject )}})}


  // :: (MaybeThenable A... -> MaybeThenable B)
  //    -> MaybeThenable A...
  //    -> Promise Error B
  function lift(f) { return function() {
    var args = toArray(arguments)
    return all(args).then(function(values) {
                            return f.apply(null, values) })}}


  // :: (MaybeThenable A..., (Error, B) -> ())
  //    -> MaybeThenable A...
  //    -> Promise Error B
  function liftNode(f) { return function() {
    var args = toArray(arguments)
    return promise(function(resolve, reject) {
                     all(args).then(function(values) {
                                      var args = values.concat([resolver])
                                      f.apply(null, args) })


                     function resolver(error, values) {
                       if (error)  reject(error)
                       else        resolve(values) }})}}


  // -- List processing helpers ----------------------------------------

  // :: (A -> B) -> MaybeThenable [A] -> Promise Error [B]
  function map(f) { return lift(function(values) {
                                  return all(values.map(f)) })}


  // :: MaybeThenable [[A]] -> Promise Error [A]
  var flatten = lift(function(values) {
                       return values.reduce(function(as, bs) {
                                              return as.concat(bs) }
                                           ,[])})


  // :: MaybeThenable [String] -> Promise Error String
  var join = lift(function(values, separator) {
                    return promiseFrom(values).then(function(vs) {
                      return vs.join(separator)
                    })})



  // :: MaybeThenable [String] -> Promise Error [String]
  function mapSequentially(f){ return lift(function(xs) {
    var length = xs.length
    var index  = 0
    var result = new Array(length)

    return promise(function(resolve, reject) {
                     function next() {
                       var x = lift(f)(xs[index])
                       result[index] = x

                       if (++index >= length)  resolve(all(result))
                       else                    x.then(next) }

                     next() })})}


  // -- File system interaction ----------------------------------------

  // :: Pathname -> Promise Error [Pathname]
  var listDirectory = liftNode(fs.readdir)
  var readFile      = liftNode(fs.readFile)
  var lstat         = liftNode(fs.lstat)

  // :: Pathname -> Promise Error String
  function read(path) {
    return isString(path)?  lstat(path)
    :      /* otherwise */  promiseFrom(String(path)) }

  // :: Pathname -> Pathname -> Pathname
  function withParent(dir) { return function(base) {
    return joinPath(dir, base) }}


  // -- Other generators -----------------------------------------------

  // :: Number -> Promise () [String]
  var noiseList = lift(function(n) {
                         return n <= 0?  []
                         :      /* _ */  Array(n + 1)
                                           .join(0)
                                           .split(0)
                                           .map(function(_, i){ return i })})


  // -- The main public interface --------------------------------------
  //
  // Since the `listDirectory` function isn't recursive, this should only
  // be called with a directory that has only files. The noise factor
  // defines the number of values that are not asynchronous in the list.
  //
  // The computation asynchronously reads all the files in the directory
  // in parallel, then concatenates the list of file contents with the
  // list of plain values, and finally returns a promise for a single
  // string where all of the values are separated by a new line.
  //
  // The purpose is to check how well a Promise implementation can cope
  // with real world scenarios where mixed data (both sync & async) happen
  // when processing something. The synchronous data might be a result of
  // caching, and while a 4ms delay might be better than reading the file
  // again, we want aggressive performance when we cache something, so even
  // this amount of delay hurts.

  // :: Pathname, Number -> Promise Error [String]
  return function main(path, noiseFactor) {
    var files      = map(withParent(path))(listDirectory(path))
    var noise      = noiseList(noiseFactor)
    var wholeList  = flatten(all([files, noise]))

    return mapSequentially(read)(wholeList) }

}