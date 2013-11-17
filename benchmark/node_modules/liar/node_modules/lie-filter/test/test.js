'use strict';
var filter = require('../lib/filter');
var resolve = require('lie-resolve');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("filter", function() {
  it("should work", function() {
    return filter([1,2,3,4],function(v){return v%2}).should.become([1,3]);
  });
  it("should work if all are false", function() {
    return filter([1,2,3,4],function(v){return false;}).should.become([]);
  });
  it("should work async", function() {
    return filter([resolve(1),resolve(2),3,4],function(v){return v%2}).should.become([1,3]);
  });
  it("should work async if all are false", function() {
    return filter([1,resolve(2),resolve(3),4],function(v){return false;}).should.become([]);
  });
});