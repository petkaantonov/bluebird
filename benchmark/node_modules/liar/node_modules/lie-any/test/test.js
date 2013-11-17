'use strict';
var any = require('../lib/any');
var resolve = require('lie-resolve');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("any", function() {
  it("should become true", function() {
    return any([1,2,3,4],function(v){return !(v%4);}).should.become(true);
  });
  it("should become false", function() {
    return any([1,2,3,4],function(v){return !(v%5);}).should.become(false);
  });
  it("should become true async", function() {
    return any([resolve(1),resolve(2),3,4],function(v){return !(v%4)}).should.become(true);
  });
  it("should become false async", function() {
    return any([resolve(1),resolve(2),3,4],function(v){return !(v%5);}).should.become(false);
  });
  it("should be lazy", function() {
    return any([promise(function(yes,no){
        setTimeout(function(){
            no('nope');
        },50);
    }),promise(function(yes,no){
        setTimeout(function(){
            yes(2);
        },10);
    }),3,4],function(v){return v===2;}).should.become(true);
  });
  it("should fail on a failure", function() {
    return any([promise(function(yes,no){
        setTimeout(function(){
            no('nope');
        },10);
    }),promise(function(yes,no){
        setTimeout(function(){
            yes(2);
        },50);
    }),3,4],function(v){return v===2;}).should.be.rejected.and.become('nope');
  });
  it('should work without a function',function(){
      return any([0,false,3,null]).should.become(true);
  });
  it('should still give a false without a function',function(){
      return any([0,false,null]).should.become(false);
  });
  it('should work without a function async',function(){
      return any([resolve(0),resolve(false),3,null]).should.become(true);
  });
  it('should still give a false without a function async',function(){
      return any([resolve(0),resolve(false),null]).should.become(false);
  });
});