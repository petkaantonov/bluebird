var app = module.exports = {};

var TestType = require('./testType');

app.perfIndex = null;

app.promise = function(Prom, defer, testType) {
  var def = defer();
  var def2 = defer();
  var def3 = defer();
  var def4 = defer();
  var def5 = defer();
  var def6 = defer();
  var def7 = defer();

  var sync = TestType.SYNC === testType;
  var mixed = TestType.MIXED === testType;

  function doResolve(_def, optMixed) {
    return function(){
      if (sync || (mixed && !optMixed)) {
        _def.resolve();
      } else {
        setImmediate(function(){_def.resolve()});
      }
    };
  }

  // chain them
  def7.promise.then(doResolve(def6))
    .then(doResolve(def5))
    .then(doResolve(def4))
    .then(doResolve(def3, true))
    .then(doResolve(def2, true))
    .then(doResolve(def, true));


  if (sync) {
    def7.resolve();
  } else {
    setImmediate(function(){def7.resolve();});
  }

  return def.promise;
};

// will use the bare Promises/A+ implementation
// https://github.com/then/promise
// This API is specific to when.js (although Q has something similar)
app.promiseBare = function(Prom, testType) {

  return new Prom(function(resolve) {
    var p2, p3, p4, p5, p6, p7, r2, r3, r4, r5, r6, r7;

    var sync = TestType.SYNC === testType;
    var mixed = TestType.MIXED === testType;

    p2 = new Prom(function(resolve) { r2 = resolve; });
    p3 = new Prom(function(resolve) { r3 = resolve; });
    p4 = new Prom(function(resolve) { r4 = resolve; });
    p5 = new Prom(function(resolve) { r5 = resolve; });
    p6 = new Prom(function(resolve) { r6 = resolve; });
    p7 = new Prom(function(resolve) { r7 = resolve; });

    function doResolve(r, optMixed) {
      return function(){
        if (sync || (mixed && !optMixed)) {
          r();
        } else {
          setImmediate(r);
        }
      };
    }

    p7
      .then(doResolve(r6))
      .then(doResolve(r5))
      .then(doResolve(r4))
      .then(doResolve(r3, true))
      .then(doResolve(r2, true))
      .then(doResolve(resolve, true));

    if (sync) {
      r7();
    } else {
      setImmediate(r7);
    }
  });
};



var firstCallback = false;
var vanillaCount = 0;
app.vanilla = function(perf, testType, cb) {
  var count = vanillaCount++;
  perf.log('Creating async stub func:' + count);

  // the final stub function in the chain
  function do7() {
    if (!firstCallback) {
      firstCallback = true;
      app.perfIndex = perf.log('FIRST callback resolved');
    } else {
      perf.log('callback resolved:' + count);
    }

    if (TestType.SYNC === testType) {
      cb();
    } else {
      setImmediate(cb);
    }
  }

  var fndo6, fndo5, fndo4, fndo3, fndo2;
  switch (testType) {
  case TestType.SYNC:
    fndo6 = function do6() { do7(); };
    fndo5 = function do5() { fndo6(); };
    fndo4 = function do4() { fndo5(); };
    fndo3 = function do3() { fndo4(); };
    fndo2 = function do2() { fndo3(); };
    fndo2();
    break;
  case TestType.MIXED:
    fndo6 = function do6() { setImmediate(do7); };
    fndo5 = function do5() { setImmediate(fndo6); };
    fndo4 = function do4() { fndo5(); };
    fndo3 = function do3() { fndo4(); };
    fndo2 = function do2() { fndo3(); };
    fndo2();
    break;
  case TestType.ASYNC:
    fndo6 = function do6() { setImmediate(do7); };
    fndo5 = function do5() { setImmediate(fndo6); };
    fndo4 = function do4() { setImmediate(fndo5); };
    fndo3 = function do3() { setImmediate(fndo4); };
    fndo2 = function do2() { setImmediate(fndo3); };
    setImmediate(fndo2);
    break;
  }
};

app.vanillaReset = function() {
  firstCallback = false;
  vanillaCount = 0;
};
