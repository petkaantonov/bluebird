var path      = require('path')
var benchmark = require('../../benchmark')

var isHarmony = benchmark.isHarmony
var dirname   = path.join(__dirname, '../../fixtures/files')

function done(deferred) { deferred.resolve() }

function run(noise, bench) {
  if (isHarmony()) bench('Co', require('./co')(dirname, noise))
  bench('Callbacks (baseline)', require('./callbacks')(dirname, noise, done))
  bench('Async', require('./async')(dirname, noise, done))
  bench('Pinky', require('./pinky')(dirname, noise))
  bench('Pinky (synchronous)', require('./pinky-sync')(dirname, noise))
  bench('Q', require('./q')(dirname, noise))
  bench('When', require('./when')(dirname, noise))
  bench('Deferred', require('./deferred')(dirname, noise))
  bench('Bluebird', require('./bluebird')(dirname, noise))
  bench('Bluebird sync build', require('./bluebird_sync')(dirname, noise))
}

benchmark.suite('Serial (no noise)', function(bench) {
  run(0, bench)
})

benchmark.suite('Serial (some noise)', function(bench) {
  run(50, bench)
})

benchmark.suite('Serial (noisy)', function(bench) {
  run(100, bench)
})

benchmark.suite('Serial (mostly noise)', function(bench) {
  run(300, bench)
})
