'use strict';
var denodify = require('../lib/denodify');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("denodify",function(){
    describe('singleValue',function(){
        var nodeLike = denodify(function(a,cb){
            if(typeof a === 'number'){
                cb(null,a);
            }else if(typeof a === 'string'){
                cb(a);
            }
        });
        it('should work',function(){
            return nodeLike(5).should.become(5);
        });
        it('should throw',function(){
            return nodeLike('boo').should.be.rejected.and.become('boo');
        });
    });
    describe('multivalue',function(){
        var nodeLike = denodify(function(a,b,cb){
            if(typeof a === 'number'&&typeof b === 'number'){
                cb(null,a+b);
            }else if(typeof a === 'number'&&typeof b === 'function'){
                b(null,a);
            }else if(typeof a === 'string'){
                if(typeof b === 'function'){
                    b(a);
                }else{
                    cb(a);
                }
            }else if(typeof b === 'string'){
                cb(b);
            }else if(typeof a === 'function'){
                a('need a value');
            }
        });
        it('should work',function(){
            return nodeLike(5).should.become(5);
        });
        it('should work with 2 numbers',function(){
            return nodeLike(2,3).should.become(5);
        });
        it('should work with a number and a string',function(){
            return nodeLike(2,'boo').should.be.rejected.and.become('boo');
        });
        it('should work with a number and a string',function(){
            return nodeLike('boo').should.be.rejected.and.become('boo');
        });
        it('should work with a no arguments',function(){
            return nodeLike().should.be.rejected.and.become('need a value');
        });
    });
});