var slurp = require('noisyo').slurp
var lift  = require('pinky-for-fun').lift
var λ     = require('athena')
var str   = require('lingerie')

var parseJson = lift(JSON.parse)
var show      = lift(console.log.bind(console))

var kind  = process.argv[2]
var dataP = parseJson(slurp(process.stdin))

if (!kind) { console.log('You should specify a kind of data.')
             process.exit(1) }

function property(name) { return function(object) {
  return object[name] }}

function filterByKind(kind, data) {
  return data.filter(λ.compose(str.startsWith(kind), property('name'))) }

function extractLabel(text) {
  var match = text.match(/\((.+)\)/)
  return match?  match[1]
  :              '' }

function zipWith(xs, ys) {
  return xs.reduce(function(zs, x, i) {
                     zs.push([x, ys[i]])
                     return zs }
                  ,[] )}

function makeRow(labelAndData) {
  var label = labelAndData[0]
  var data  = labelAndData[1]

  return [label].concat(data.stats.map(property('time'))) }


dataP.then(function(data) {
  var points  = filterByKind(kind, data)
  var labels  = points.map(λ.compose(extractLabel, property('name')))
  var heading = [' '].concat(points[0].stats.map(property('name')))
  var rows    = zipWith(labels, points).map(makeRow)

  console.log(JSON.stringify([heading].concat(rows)))

}).otherwise(function(error) {
  process.nextTick(function(){ throw error }) })