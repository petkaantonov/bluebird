'use strict';
var every = require('../lib/every');
var resolve = require('lie-resolve');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("every", function() {
    describe('basic', function() {
        it("should become true", function() {
            return every([1, 2, 3, 4], function(v) {
                return v < 5
            }).should.become(true);
        });
        it("should become false 1", function() {
            return every([1, 2, 3, 4], function(v) {
                return v > 1;
            }).should.become(false);
        });
        it("should become false 2", function() {
            return every([1, 2, 3, 4], function(v) {
                return v < 4;
            }).should.become(false);
        });
    });
    describe('async', function() {
        it("should become true", function() {
            return every([resolve(1), resolve(2), 3, 4], function(v) {
                return v < 5
            }).should.become(true);
        });
        it("should become false 1", function() {
            return every([resolve(1), resolve(2), 3, 4], function(v) {
                return v > 1;
            }).should.become(false);
        });
        it("should become false 2", function() {
            return every([resolve(1), resolve(2), 3, 4], function(v) {
                return v < 4;
            }).should.become(false);
        });
    });
    describe('no func', function() {
        it('should work',function(){
            return every([resolve(1), resolve(2), 3, 4]).should.become(true); 
        });
        it('should fail 1',function(){
            return every([resolve(1), resolve(2), 0, 4]).should.become(false); 
        });
        it('should fail 2',function(){
            return every([resolve(1), resolve(0), 3, 4]).should.become(false); 
        });
    });
    describe('lazy',function(){
        it("should be lazy", function() {
            return every([promise(function(yes,no){
                setTimeout(function(){
                    no('nope');
                },50);
            }),promise(function(yes,no){
                setTimeout(function(){
                    yes(2);
                },10);
            }),3,5],function(v){return v%2;}).should.become(false);
          });
          it("should fail on a failure", function() {
            return every([promise(function(yes,no){
                setTimeout(function(){
                    no('nope');
                },10);
            }),promise(function(yes,no){
                setTimeout(function(){
                    yes(2);
                },50);
            }),3,5],function(v){return v%2;}).should.be.be.rejected.and.become('nope');
          });
    });
});