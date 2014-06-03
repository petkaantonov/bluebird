var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var Promise = adapter;

describe("tearDown", function () {
  specify("it should be called after finally", function (done) {
    var state = 0;
    Promise(function (r) {
        state = 1;
        r();
      }).tearDown(function () {
        assert.equal(state, 3);
        done();
      }).
      finally(function () {
        state = 3;
      }).then(function () {
        state = 2;
      });
  });
});
