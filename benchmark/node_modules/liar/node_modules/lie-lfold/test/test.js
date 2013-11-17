'use strict';
var resolve = require('lie-resolve');
var lfold = require('../lib/lfold');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("lfold", function() {
    it('should work',function(){
        return lfold([1,2,3,4,5],function(a,b){
            a.push(b);
            return resolve(a);
        },[]).should.become([1,2,3,4,5]);
    });
    it('should work without an accumulator',function(){
        return lfold([[],1,2,3,4,5],function(a,b){
            a.push(b);
            return a;
        }).should.become([1,2,3,4,5]);
    });
    it('should work with a mixture of things which returns a promise',function(){
        return lfold([2,resolve(5),3],function(a,b){
            return resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return lfold([2,resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
});