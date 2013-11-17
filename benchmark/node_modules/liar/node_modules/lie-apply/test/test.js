'use strict';
var apply = require('../lib/apply');
var cast = require('lie-cast');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("cast",function(){
    it('should work without a value',function(){
        return apply(function(){return cast(1)}).should.become(1);
    });
    it('should work with a promise',function(){
        return apply(function(a){
            return a+a;
        },cast(2)).should.become(4);
    });
    it('should work with a value',function(){
        return apply(function(a){
            return a+a;
        },2).should.become(4);
    });
    it('should work with several values',function(){
        return apply(function(a,b,c){
            return a+b+c;
        },'a','b','c').should.become('abc');
    });
    it('should work with several promises',function(){
        return apply(function(a,b,c){
            return a+b+c;
        },cast('a'),cast('b'),cast('c')).should.become('abc');
    });
    it('should work with a mixture',function(){
        return apply(function(a,b,c){
            return a+b+c;
        },cast('a'),'b',cast('c')).should.become('abc');
    });
});