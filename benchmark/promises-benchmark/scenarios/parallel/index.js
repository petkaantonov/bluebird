var path      = require('path')
var benchmark = require('../../benchmark')
var isHarmony = benchmark.isHarmony

function done(deferred) { deferred.resolve() }

function K(x){ return function(){ return x }}

function dup(val, times) {
  return Array(times + 1).join(0).split(0).map(K(val)) }

function filename(_, i) {
  return path.join(benchmark.fixtureDir, 'test_' + (i+1) + '.txt') }

function genList(dupFactor) {
  var xs    = Array(100).join(0).split(0).map(filename)
  var first = xs[0]
  var rest  = xs.slice(1, 100 - dupFactor).concat(dup(first, dupFactor))
  return [first].concat(rest).slice(0, 100) }

function run(dupFactor, bench) {
  var xs = genList(dupFactor)

  var type = dupFactor == 0?  'naive' : 'cached'

  if (isHarmony()) bench('Co', require('./co')(xs))
  bench('Callbacks (baseline)', require('./callbacks')[type](xs, done))
  bench('Async', require('./async')[type](xs, done))
  bench('Pinky', require('./pinky')(xs))
  bench('Pinky (synchronous)', require('./pinky-sync')(xs))
  bench('Q', require('./q')(xs))
  bench('When', require('./when')(xs))
  bench('Deferred', require('./deferred')(xs))
  bench('Bluebird', require('./bluebird')(xs))
  bench('Bluebird sync build', require('./bluebird_sync')(xs))

  }


benchmark.suite('Parallelism (no cache)', function(bench) {
  run(0, bench) })

benchmark.suite('Parallelism (small cache)', function(bench) {
  run(10, bench) })

benchmark.suite('Parallelism (big cache)', function(bench) {
  run(60, bench) })

benchmark.suite('Parallelism (fully cached)', function(bench) {
  run(100, bench) })