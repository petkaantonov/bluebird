module.exports = function(promise) {

  var fs    = require('fs')
  var cache = {}

  function promiseOf(a) {
    return promise(function(resolve){ resolve(a) })}


  function isPromise(a) {
    return a
    &&     typeof a.then === 'function' }


  function promiseFrom(a) {
    return isPromise(a)?    a
    :      /* otherwise */  promise(function(resolve){ resolve(a) })}


  function readFile(name) {
    return promise(function(resolve, reject) {
                     fs.readFile(name, function(err, data) {
                                         if (err)  reject(err)
                                         else      resolve(data) })})}


  function read(name) {
    return  name in cache?   promiseOf(cache[name])
    :       /* otherwise */  cache[name] = readFile(name) }


  function parallel(xs) {
    return promise(function(resolve, reject) {
                     var len    = xs.length
                     var result = new Array(len)
                     xs.map(promiseFrom).forEach(resolvePromise)

                     function resolvePromise(p, i) {
                       p.then( function(value) {
                                 result[i] = value
                                 if (--len == 0)  resolve(result) }

                             , reject )}})}


  return function(list) {
    cache = {}
    return parallel(list.map(read)) }
}