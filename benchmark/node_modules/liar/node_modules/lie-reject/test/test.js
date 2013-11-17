'use strict';
var reject = require('../lib/reject');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("Use with Chai as Promised", function() {
  it(".should.be.fulfilled", function() {
    return reject().should.be.rejected;;
  });
   it(".should.be.rejected.with(TypeError, 'boo')", function() {
    return reject(new TypeError("boo!")).should.be.rejectedWith(TypeError, "boo");
  });
  it(".should.be.fulfilled with a value", function() {
    return reject(9).should.be.rejected.and.become(9)
  });
});