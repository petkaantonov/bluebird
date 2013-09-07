// I am sorry for the quality of the code, it was written on the knee
// to check why kickq was performing poorly and expanded from there on.

var runners = require('./lib/runners');
var TestType = require('./lib/testType');
//
//
// test parameters
//
//

// how many tests to perform for each set of loops.
runners.totalMasterLoops = 20;


// Promises Perf


var fs = require('fs');
// var util = require('util');

var when   = require('when');
var Q = require('q');
var bluebird = require("../../js/bluebird.js");
var bluebirdSync = require("../../js/bluebird_sync.js");
var deferred = require('deferred');
var Promise = require('promise');

var allResults = [];

bluebird.defer = bluebird.pending;
bluebirdSync.defer = bluebirdSync.pending;

var bbp = bluebird.pending().constructor.prototype
var bbsp = bluebirdSync.pending().constructor.prototype
bbp.resolve = bbp.fulfill;
bbsp.resolve = bbsp.fulfill;

function run(Prom, Defer, loops, promText, testType) {
  var def = when.defer();
  try {
    runners.run(Prom, Defer, loops, testType, promText, function(results){
      // console.log('RUN DONE: loops, promText, results :: ', loops, promText, results);
      allResults.push({
        lib: promText,
        loops: loops,
        results: results
      });

      def.resolve();
    });
  } catch(ex) {
    def.reject(ex);
    console.log('run error:', ex);
  }
  return def.promise;
}

/**
 * Remove trailing comma and add a newline
 * @param  {string} str the string.
 * @return {string}
 */
function nl(str) {
  str = str.substr(0, str.length - 1);
  str += '\n';
  return str;
}


/**
 * Generates the summary in a csv format.
 * @return {string} The csv in a string.
 */
function generateCSV() {
  var out = '';
  var header = 'loops,';
  var curItem = '';
  // go for all results to fetch libraries
  allResults.forEach(function(item) {

    if (curItem !== item.lib) {
      curItem = item.lib;
      header += item.lib + ',';
    }
  });
  header = nl(header);

  function getAvg(ar, prop) {
    var sum = ar.reduce(function(a,b) { return a[prop] || a + b[prop];});
    var avg = sum / runners.totalMasterLoops;
    return Math.round(avg * 100) / 100;
  }


  // the main container
  var summary = Object.create(null);
  // go for all results and summarize them
  allResults.forEach(function(item) {

    var avgTime = getAvg(item.results, 'diff');
    var avgTotal = getAvg(item.results, 'totalTime');
    var avgMem = getAvg(item.results, 'mem');

    summary[item.loops] = summary[item.loops] || [];
    summary[item.loops].push({
      avgTime: avgTime,
      avgMem: avgMem,
      totalTime: avgTotal
    });
  });


  // return a full block of data for defined prop ('avgTime' or 'avgMem')
  function getFacet(prop) {
    var facet = '';
    for(var loop in summary) {
      facet += loop + ',';
      summary[loop].forEach(function(item) {
        facet += item[prop] + ',';
      });
      facet = nl(facet);
    }

    return facet;
  }

  // create the string output for time diffs
  out += '-- Avg Diffs in milliseconds\n';
  out += header;
  out += getFacet('avgTime');
  // create the string output for total time
  out += '\n';
  out += '-- Total Time in milliseconds\n';
  out += header;
  out += getFacet('totalTime');
  // create the string output for mem diffs
  out += '\n';
  out += '-- Avg Mem % from initial - !!! Only reliable when a single test is run\n';
  out += header;
  out += getFacet('avgMem');

  return out;
}

function saveFile(outputfile, contents) {
  fs.writeFileSync(outputfile, contents);
}

function control(runs, csvFile) {


  if (0 === runs.length) {
    // the end
    console.log('All Done!');
    var csvData;
    try{
      csvData = generateCSV();
    } catch(ex) {
      console.log('ex:', ex);
    }
    if (csvFile && csvFile.length) {
      console.log('Saving csv to file...');
      saveFile(csvFile, csvData);
      console.log('CSV file saved to: "' + csvFile + '"');
    }

    console.log('\nSummary:');
    console.log(csvData);
    return;
  }
  setTimeout(function(){
    var params = runs.shift();

    console.log('\n\nStarting perf test for: ' + params[2] + ' Loops: ' + params[1]);

    run(params[0], params[4] || params[0].defer, params[1], params[2], params[3])
      .then(control.bind(null, runs, csvFile), console.log);
  }, 1000);

  // run the GC
  global.gc();
}

// Long Stack Traces
// http://documentup.com/kriskowal/q/#tutorial/long-stack-traces
Q.longStackJumpLimit = 0;

// hack deferred lib
deferred.all = deferred.map;

// Define the way stub funcs will resolve: SYNC, MIXED, ASYNC


var testTypeArg = process.argv[2];

var testType = testTypeArg === "async"
    ? TestType.ASYNC
    : testTypeArg === "mixed"
        ? TestType.MIXED
        : testTypeArg === "sync"
            ? TestType.SYNC
            : null;

if( testType === null )throw new Error("unknown TestType: "+ testTypeArg);

var runs = [
  // [false, 10, 'async', testType],
  // [false, 100, 'async', testType],


  [bluebird, 500, 'bluebird', testType],
  [bluebirdSync, 500, 'bluebird sync build', testType],

  [false, 500, 'async', testType],
  // [false, 1000, 'async', testType],

  // [require('./packages/when1.8.1/'), 10, 'when-1.8.1', testType],
  // [require('./packages/when1.8.1/'), 100, 'when-1.8.1', testType],
  [require('./packages/when1.8.1/'), 500, 'when-1.8.1', testType],
  // [require('./packages/when1.8.1/'), 1000, 'when-1.8.1', testType],

  // [require('./packages/when2.0.1/'), 10, 'when-2.0.1', testType],
  // [require('./packages/when2.0.1/'), 100, 'when-2.0.1', testType],
  // [require('./packages/when2.0.1/'), 500, 'when-2.0.1', testType],
  // [require('./packages/when2.0.1/'), 1000, 'when-2.0.1', testType],

  // // The default when is from dev branch 2.1.x
  // [when, 10, 'when-2.1.0', testType],
  // [when, 100, 'when-2.1.0', testType],
  [when, 500, 'when-2.1.0', testType],
  // [when, 1000, 'when-2.1.0', testType],

  // [Q, 10, 'Q-0.9.5', testType],
  // [Q, 100, 'Q-0.9.5', testType],
  [Q, 500, 'Q-0.9.5', testType],
  // [Q, 1000, 'Q-0.9.5', testType],


  // [deferred, 10, 'deferred-0.6.3', testType, deferred ],
  // [deferred, 100, 'deferred-0.6.3', testType, deferred ],
  [deferred, 500, 'deferred-0.6.3', testType, deferred],
  // [deferred, 1000, 'deferred-0.6.3', testType, deferred],
  //
  [Promise, 500, 'Promise-3.0.1', testType, Promise]


  // [rsvp, 10, 'rsvp']

  // memory single test runs of 500 loops
  // [false, 500, 'mem-async']
  // [require('./packages/when1.8.1/'), 500, 'mem-when-1.8.1']
  // [require('./packages/when2.0.1/'), 500, 'mem-when-2.0.1']
  // [when, 500, 'mem-when-2.1.x']
  // [Q, 500, 'mem-Q'],
  // [deferred, 500, 'mem-deferred-0.6.3', deferred]
];

if (!global.gc) {
  throw new Error('run node using the --expose-gc option');
}

var outputcsv = process.argv[2];

control(runs, outputcsv);


