'use strict';
var map = require('../lib/map');
var resolve = require('lie-resolve');
var reject = require('lie-reject');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("map", function() {
    describe('with values',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return n;
            }else{
                throw n;
            }
        }
        it('should work',function(){
            return map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return map([resolve(1),resolve(3),resolve(5),resolve(7),resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
        it('should work on an empty array',function(){
            return map([],loveNumbers).should.become([]);
        });
    });
    describe('with simple promises',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return resolve(n);
            }else{
                return reject(n);
            }
        }
        it('should work',function(){
            return map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return map([resolve(1),resolve(3),resolve(5),resolve(7),resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
    });
    describe('with complex promises',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return promise(function(yes,no){
                    setTimeout(function(){
                        yes(n);
                    },10-n);
                });
            }else{
                return promise(function(yes,no){
                    setTimeout(function(){
                        no(n);
                    },10*Math.random());
                });
            }
        }
        it('should work',function(){
            return map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return map([resolve(1),resolve(3),resolve(5),resolve(7),resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
    });
});