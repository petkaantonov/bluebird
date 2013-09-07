var Benchmark = require('benchmark')
var path      = require('path')
var fs        = require('fs')
// sync so we don't fuck up with other benchs
var read      = fs.readFileSync
var write     = fs.writeFileSync
var exists    = fs.existsSync

var queue   = []
var running = null
var log     = console.log.bind(console)

function suite(name, block) {
  var s = new Benchmark.Suite(name)
  block(bench(s))

  if (!running)  run(s, save)
  else           queue.push(s)
}

function hasErrors(data) {
  return data.some(function(a){ return a.error })
}

function save(data, bench) {
  if (hasErrors(data))  return log('Not saving because errors occurred.')

  var previous = exists('bench.json')?  read('bench.json', 'utf-8')
               : /* otherwise */        '[]'

  var resultStream = JSON.parse(previous)
  resultStream.push({ name:  bench.name
                    , date:  new Date
                    , stats: data })

  write('bench.json', JSON.stringify(resultStream))
}

function bench(suite){ return function(name, code) {
  suite.add(name, { defer: true, fn: code })
}}

function fastest(suite) {
  return suite.filter('fastest').pluck('name') }

function slowest(suite) {
  return suite.filter('slowest').pluck('name') }

function run(suite, cb) {
  var err     = 0
  var results = []
  suite.on('cycle', function(event) {
                      var bench = event.target
                      results.push({ name      : bench.name
                                   , error     : bench.error
                                   , time      : bench.hz
                                   , variation : bench.stats.rme })

                      if (bench.error) console.error( '\x1B[0;31m' + ++err + ')'
                                                    , String(bench)
                                                    , bench.error.message
                                                    , '\n'
                                                    , bench.error.stack || ''
                                                    , '\x1B[0m')

                      else             log('››', String(bench)) })

  suite.on('complete', function() {
                         log('---'
                            ,'\nFastest:', fastest(this).join(', ')
                            ,'\nSlowest:', slowest(this).join(', '))
                         if (cb)  cb(results, suite)

                         running  = null
                         var next = queue.shift()
                         if (next)  run(next, cb) })

  log('\x1B[0;36m\n:: Benchmarks for:', suite.name)
  log('   Sit back, this can take a while.\x1B[0m\n---')

  running = suite

  suite.run({ defer: true, async: true }) }


function isHarmony() {
  return process.execArgv.indexOf('--harmony-generators') != -1 }


module.exports = { suite: suite
                 , run: run
                 , isHarmony: isHarmony
                 , fixtureDir: path.join(__dirname, 'fixtures', 'files')
                 }
