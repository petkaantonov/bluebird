'use strict';
var use = require('../lib/use');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("use",function(){
    function loveNumbers(n){
        if(n.then && typeof n.then === 'function'){
            throw 'fit';
        }
        if(typeof n === 'number'){
            return n*2;
        }else{
            throw n;
        }
    }
    it('should work with a value',function(){
        return use(1,loveNumbers).should.equal(2);
    });
    it('should work with a promise',function(){
        return use(promise(function(yes){yes(1)}),loveNumbers).should.become(2);
    });
    it('should work with an error',function(){
        return use(promise(function(yes){yes('boo')}),loveNumbers).should.be.rejected.and.become('boo');
    });
});