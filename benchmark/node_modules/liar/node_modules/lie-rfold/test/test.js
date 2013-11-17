'use strict';
var resolve = require('lie-resolve');
var rfold = require('../lib/rfold');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("rfold", function() {
    it('should work',function(){
        return rfold([1,2,3,4,5],function(a,b){
            return resolve(a.concat(b));
        },[]).should.become([5,4,3,2,1]);
    });
    it('should work without an accumulator',function(){
        return rfold([1,2,3,4,5,[]],function(a,b){
            return a.concat(b);
        }).should.become([5,4,3,2,1]);
    });
    it('should work with a mixture of things which returns a promise',function(){
        return rfold([2,resolve(5),3],function(a,b){
            return resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return rfold([2,resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
});