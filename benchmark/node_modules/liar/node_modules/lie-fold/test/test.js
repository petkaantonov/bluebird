'use strict';
var resolve = require('lie-resolve');
var fold = require('../lib/fold');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("fold", function() {
    it('should work with a mixture of things which returns a promise',function(){
        return fold([2,resolve(5),3],function(a,b){
            return resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return fold([2,resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
    it('should work',function(){
        return fold([
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },30);
            })
        ],function(a,b){
            return resolve(a.concat(b));
        },[]).should.become([1,2,3,4,5]);
    });
    it('should work without an accumulator',function(){
        return fold([[],
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },30);
            })],function(a,b){
            return resolve(a.concat(b));
        }).should.become([1,2,3,4,5]);
    });
});