'use strict';
var resolve = require('lie-resolve');
var zip = require('../lib/zip');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("zip", function() {
    describe('should work on values',function(){
        it('with one array',function(){
            return zip([1,2,3,4,5]).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return zip([1,2,3,4,5],['a','b','c','d','e']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return zip([1,2,3,4,5],['a','b','c','d','e'],[10,20,30,40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on promises',function(){
        it('with one array',function(){
            return zip([1,2,3,4,5].map(resolve)).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return zip([1,2,3,4,5].map(resolve),['a','b','c','d','e'].map(resolve)).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return zip([1,2,3,4,5].map(resolve),['a','b','c','d','e'].map(resolve),[10,20,30,40,50].map(resolve)).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on a mixuture of promises and values',function(){
        it('with one array',function(){
            return zip([resolve(1),2,resolve(3),4,5]).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return zip([1,2,3,4,5].map(resolve),['a','b','c','d','e']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return zip([1,2,3,4,5],['a','b','c','d','e'].map(resolve),[10,20,resolve(30),40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on uneven sized arrays',function(){
        it('with two arrays one shorter',function(){
            return zip([1,2,3,4,5].map(resolve),['a','b','c','d']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d']]);
        });
        it('with three arrays all different sizes',function(){
            return zip([1,2,3,4,5,6],['a','b','c'].map(resolve),[10,20,resolve(30),40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30]]);
        });
    });
});