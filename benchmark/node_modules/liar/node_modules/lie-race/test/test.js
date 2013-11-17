'use strict';
var race = require('../lib/race');
var promise = require('lie');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("race", function() {
    /*not planning on testing this much
      unless I can figure out a better
      way to test something that is
      inherently a race condition*/
    it('should work',function(){
        return race([
            promise(function(yes,no){
                setTimeout(function(){
                    yes('no');
                },20);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('yes');
                },10);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('seriously no');
                },30);
            })
        ]).should.become('yes');
    });
    it('should work with an error',function(){
        return race([
            promise(function(yes,no){
                setTimeout(function(){
                    yes('no');
                },20);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    no('no');
                },10);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('seriously no');
                },30);
            })
        ]).should.be.rejected.and.become('no');
    });
});