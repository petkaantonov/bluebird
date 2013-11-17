'use strict';
var resolve = require('../lib/resolve');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("Use with Chai as Promised", function() {
  it(".should.be.fulfilled", function() {
    return resolve().should.be.fulfilled;
  });
  it(".should.be.fulfilled with a value", function() {
    return resolve(9).should.become(9);
  });
  it(".should.be.fulfilled with a nested value", function() {
    return resolve(resolve(9)).should.become(9);
  });
});