'use strict';
var promise = require('lie');
var all = require('../lib/all');
var resolve = require('lie-resolve');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe("all", function() {
    describe('array',function(){
        it('should work',function(){
            return all([promise(function(yes){yes(1)}),promise(function(yes){yes(3)}),promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})]).should.become([1,3,5,7,9]);
        });
        it('should work mixed',function(){
            return all([promise(function(yes){yes(1)}),3,promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})]).should.become([1,3,5,7,9]);
        });
        it('should reject',function(){
            return all([
                promise(function(yes){yes(1)}),
                promise(function(yes,no){no(3)}),
                promise(function(yes){yes(5)}),
                promise(function(yes){yes(7)}),
                promise(function(yes){yes(9)})
            ]).should.become([1,3,5,7,9]).should.be.rejected.and.become(3);
        });
        it('should work with nested values',function(){
            return all([promise(function(yes){yes(promise(function(yes){yes(1)}))}),promise(function(yes){yes(3)}),promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})]).should.become([1,3,5,7,9]);
        });
        it('return an empty array for an empty array',function(){
            return all([]).should.become([]);
        });
    });
    describe('promise',function(){
        it('should work',function(){
            return all(resolve([promise(function(yes){yes(1)}),promise(function(yes){yes(3)}),promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})])).should.become([1,3,5,7,9]);
        });
        it('should work mixed',function(){
            return all(resolve([promise(function(yes){yes(1)}),3,promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})])).should.become([1,3,5,7,9]);
        });
        it('should reject',function(){
            return all(resolve([
                promise(function(yes){yes(1)}),
                promise(function(yes,no){no(3)}),
                promise(function(yes){yes(5)}),
                promise(function(yes){yes(7)}),
                promise(function(yes){yes(9)})
            ])).should.become([1,3,5,7,9]).should.be.rejected.and.become(3);
        });
        it('should work with nested values',function(){
            return all(resolve([promise(function(yes){yes(promise(function(yes){yes(1)}))}),promise(function(yes){yes(3)}),promise(function(yes){yes(5)}),promise(function(yes){yes(7)}),promise(function(yes){yes(9)})])).should.become([1,3,5,7,9]);
        });
        it('return an empty array for an empty array',function(){
            return all([]).should.become([]);
        });
    });
});
