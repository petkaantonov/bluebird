var f = require('./dummy.js');

var makefakes = require('./fakemaker.js');

function wrap(f) {
  return function(x, y) {
    waitfor(var err, val) {
      f(x, y, resume);
    }
    if (err) throw err;
    return val;
  };
}

function dummySJS0() {
  var inner = f.dummy(1);
  return function() {
    waitfor (var err, val) {
      inner(resume);
    }
    if (err) throw err;
    return val;
  }
}

function dummySJS1() {
  var inner = f.dummy(2);
  return function(x) {
    waitfor (var err, val) {
      inner(x, resume);
    }
    if (err) throw err;
    return val;
  }
}

function dummySJS(n) {
  if (n === 1) return dummySJS0();
  if (n === 2) return dummySJS1();
}

function dummytSJS(n) {
  var inner = f.dummyt(n);
  return function() {
    waitfor(var err, val) {
      var args = Array.prototype.slice.apply(arguments);
      args.push(resume);
      inner.apply(this, args);
    }
    
    if (err) throw err;
    return val;
  }
}

makefakes(dummySJS, dummytSJS, wrap, global);
