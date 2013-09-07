
var utils = module.exports = {};

/**
 * Generates a more detailed csv version of the data
 * @return {string} The csv in a string.
 */
utils.generateRawCSV = function() {
  // create header
  var out = 'lib,loops,';
  var memOut = '';
  var totalLogs = runners.totalMasterLoops + 1;

  for (var i = 1; i < totalLogs; i++) {
    out += 'diff' + i + ',';
    memOut += 'mem' + i + ',';
  }
  // remove trailing comma
  memOut = memOut.substr(0, memOut.length - 1);
  out += memOut + '\n';

  // go for all results
  allResults.forEach(function(item) {
    out += item.lib + ',';
    out += item.loops + ',';
    memOut = '';
    item.results.forEach(function(itemRes){
      out += itemRes.diff + ',';
      memOut += itemRes.mem +',';
    });

    // remove trailing comma
    memOut = memOut.substr(0, memOut.length - 1);
    out += memOut + '\n';
  });

  return out;
}