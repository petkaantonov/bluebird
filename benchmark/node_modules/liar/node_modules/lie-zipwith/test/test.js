'use strict';
var resolve = require('lie-resolve');
var zipwith = require('../lib/zipwith');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("zipwith", function() {
    describe('should work on values',function(){
        it('with one array',function(){
            return zipwith(function(a){return a+a},[1,2,3,4,5]).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5],['a','b','c','d','e']).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5],['a','b','c','d','e'],[10,20,30,40,50]).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on promises',function(){
        it('with one array',function(){
            return zipwith(function(a){return a+a},[1,2,3,4,5].map(resolve)).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(resolve),['a','b','c','d','e'].map(resolve)).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5].map(resolve),['a','b','c','d','e'].map(resolve),[10,20,30,40,50].map(resolve)).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on a mixuture of promises and values',function(){
        it('with one array',function(){
            return zipwith(function(a){return a+a},[resolve(1),2,resolve(3),4,5]).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(resolve),['a','b','c','d','e']).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5],['a','b','c','d','e'].map(resolve),[10,20,resolve(30),40,50]).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on uneven sized arrays',function(){
        it('with two arrays one shorter',function(){
            return zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(resolve),['a','b','c','d']).should.become(['1a','2b','3c','4d']);
        });
        it('with three arrays all different sizes',function(){
            return zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5,6],['a','b','c'].map(resolve),[10,20,resolve(30),40,50]).should.become(['1a10','2b20','3c30']);
        });
    });
});