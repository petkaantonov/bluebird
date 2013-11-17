/*global RSVP*/

var Promise;

if (typeof RSVP !== 'undefined') {
  // Test the browser build
  Promise = RSVP.Promise;
} else {
  // Test the Node build
  RSVP = require('../dist/commonjs/main');
  Promise = require('../dist/commonjs/main').Promise;
  assert = require('./vendor/assert');
}

if (typeof window === 'undefined' && typeof global !== 'undefined') {
  window = global;
}

var adapter = {};

adapter.fulfilled = function(value) {
  return new Promise(function(resolve, reject) {
    resolve(value);
  });
};

adapter.rejected = function(error) {
  return new Promise(function(resolve, reject) {
    reject(error);
  });
};

adapter.pending = function () {
  var pending = {};

  pending.promise = new Promise(function(resolve, reject) {
    pending.fulfill = resolve;
    pending.reject = reject;
  });

  return pending;
};

module.exports = global.adapter = adapter;
