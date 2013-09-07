var runners = module.exports = {};

var when = require('when');

var Ptime = require('profy/time');
var Pmem = require('profy/mem');
var async = require('async');

var app = require('./app');

var runParams;

var noop = function(){};

runners.totalMasterLoops = 20;

function resetRunParams() {
  runParams = {
    mem: null,
    loops: null,
    Prom: null,
    defer: null,
    perfIndex: null,
    memIndex: null,
    testType: null,
    masterLoop: 0,
    promises: [],
    results: [],
    diffs: [],
    totalTimes: [],
    promise: null,
    firstPromiseResolved: false,
    masterDefer: null,
  };
}

runners.run = function(promiseImplementation, Defer, runLoops, testType, promText, cb) {
  resetRunParams();

  runParams.Prom = promiseImplementation || when;
  runParams.defer = Defer;
  runParams.loops = runLoops;
  runParams.masterLoop = 0;
  runParams.testType = testType;

  runParams.memIndex = runParams.perfIndex = NaN;
  runParams.mem = new Pmem();
  runParams.mem.start();
  runParams.results = [];
  runParams.diffs = [];
  runParams.totalTimes = [];

  // lock to when
  runParams.masterDefer = when.defer();
  runParams.masterDefer.promise.then(cb, cb);

  if (false === promiseImplementation) {
    runners.loopStartAsync();
  } else {
    // Check for bare Promise implementation
    if (/(?:Promise[.]*)/i.test(promText)) {
      // it's bare Promise
      runners.loopStartBare();
    } else {
      runners.loopStart();
    }
  }
};

runners.loopStart = function() {
  runParams.firstPromiseResolved = false;
  runParams.promises = [];
  runParams.masterLoop++;

  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < runParams.loops; i++) {
    runners.asyncNewPromise(i, perf);
  }
  perf.log('after for');
};

runners.loopStartAsync = function() {
  app.vanillaReset();

  var functions = [];
  runParams.masterLoop++;
  var perf = new Ptime();
  app.perfIndex = null;
  perf.start();
  perf.log('Start');

  for (var i = 0; i < runParams.loops; i++) {
    functions.push(app.vanilla.bind(null, perf, runParams.testType));
  }
  perf.log('after for');
  async.parallel(functions, runners.finish.bind(null, perf, runners.loopStartAsync, true));

};

runners.loopStartBare = function() {
  runParams.firstPromiseResolved = false;
  runParams.promises = [];
  runParams.masterLoop++;

  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < runParams.loops; i++) {
    setImmediate(function(){
      var prom = app.promiseBare(runParams.Prom, runParams.testType);
      runParams.promises.push(prom);
      prom.then(function(){
        if (!runParams.firstPromiseResolved) {
          runParams.firstPromiseResolved = true;
          runParams.perfIndex = perf.log('FIRST Promise resolved');
        } else {
          perf.log('Promise resolved:' + i);
        }
      });
    });
  }
  perf.log('after for');

  // all if all promises created and attach handler when all finish
  var checkInterval;
  function check() {
    if (runParams.loops === runParams.promises.length) {
      clearInterval(checkInterval);
      when.all(runParams.promises)
        .then(runners.finish.bind(null, perf, runners.loopStartBare));
    }
  }
  checkInterval = setInterval(check, 10);
};

runners.asyncNewPromise = function(i, perf) {

  setTimeout(function(){
    perf.log('Creating promise:' + i);

    runParams.promise = app.promise(runParams.Prom, runParams.defer, runParams.testType);

    runParams.promises.push(runParams.promise);
    runParams.promise.then(function() {
      if (!runParams.firstPromiseResolved) {
        runParams.firstPromiseResolved = true;
        runParams.perfIndex = perf.log('FIRST Promise resolved');
      } else {
        perf.log('Promise resolved:' + i);
      }
    }, console.error);
    if (runParams.loops === i + 1){
        runParams.Prom.all(runParams.promises)
        .then(runners.finish.bind(null, perf, runners.loopStart), console.error)
        .then(noop, console.error);
    }
  });
};

runners.finish = function(perf, cb, optIsAsyncLib, optErr, optResults) {
  perf.log('Finish');
  perf.stop();

  if (true === optIsAsyncLib) {
    // runners.finish invoked from async.parallel(), the perfIndex is in the results
    runParams.perfIndex = app.perfIndex;
  }

  // only print logs with the word 'FIRST'

  var firstOut = perf.resultTable('FIRST');
  var perfres = perf.result();

  var firstDiff = perfres.diffs[runParams.perfIndex] / 1000;

  console.log(firstOut + ' First Diff: ' + firstDiff + 'ms, total:' + perfres.stats.total + 'ms');
  // console.log(perfres);
  runParams.memIndex = runParams.mem.log('Masterloop:' + runParams.masterLoop);
  runParams.diffs.push(perf.get(runParams.perfIndex));
  runParams.totalTimes.push(perfres.stats.total);

  if (runParams.masterLoop < runners.totalMasterLoops) {
    setTimeout(cb, 500);
  } else {
    try {
      // final
      runParams.mem.stop();
      // prep stats
      for (var i = 0, len = runParams.diffs.length; i < len; i++) {
        runParams.results.push({
          diff: runParams.diffs[i].diff / 1000,
          totalTime: runParams.totalTimes[i],
          mem: runParams.mem.get(i).percent
        });
      }



      runParams.masterDefer.resolve(runParams.results);
      var memres = runParams.mem.result();
      // console.log('\nStarting memory:', memres.stats.start);
      // console.log(runParams.mem.resultTable());
      // console.log(perf.resultTable());
    } catch(ex) {
      console.log('EX:', ex);
    }
  }
};




