var assert = require("assert");

var Promise = require("../../js/debug/bluebird.js");

describe("tearDown", function () {
    specify("is called after done", function (done) {
        new Promise(function(resolve){
            resolve(1);
        }).tearDown(function () {
            done();
        }).done();
    });

    specify("works on multiple levels", function (done) {
        new Promise(function(resolve){
            resolve(1);
        }).tearDown(function () {
            done();
        }).then().then().done();
    });

    specify("bubbles from bottom", function (done) {
        var c = 0;
        new Promise(function(resolve){
            resolve(1);
        }).tearDown(function () {
            assert.equal(++c, 3);
            done();
        }).then().tearDown(function () {
            assert.equal(++c, 2);
        }).then().tearDown(function () {
            assert.equal(++c, 1);
        }).done();
    });

    specify("works with Promise.resolve", function (done) {
      var c = 0;
      Promise.resolve(1).tearDown(function () {
          assert.equal(c, 1);
          done();
      }).then(function (){
          c = 1;
      }).done();
    });
});
