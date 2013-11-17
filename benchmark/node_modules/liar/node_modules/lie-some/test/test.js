'use strict';
var some = require('../lib/some');
var resolve = require('lie-resolve');
var reject = require('lie-reject');
var all = require('lie-all');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("some", function() {
    describe('sync',function(){
        it('should work',function(){
            var a = some([resolve(1),resolve(3),resolve(5),resolve(7),resolve(9)]);
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work mixed',function(){
            var a = some([resolve(1),3,resolve(5),resolve(7),resolve(9)]);
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work with a rejection',function(){
            var a = some([resolve(1),reject(3),resolve(5),resolve(7),resolve(9)]);
            return all([a.should.eventually.include.members([1,5,7,9]),a.should.eventually.have.length(4)]);
        });
        it('should work with nested values',function(){
            var a = some([resolve(resolve(1)),resolve(3),resolve(5),resolve(7),resolve(9)]);
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work with very nested values',function(){
            var a = some([resolve().then(function(){
                return resolve(1);
            }),resolve(3),resolve(5),resolve(7),resolve(9)]);
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work when all are rejected',function(){
             var a = some([reject(1),reject(3),reject(5),reject(7),reject(9)]);
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
        it('should work when all are rejected including a thrown then',function(){
             var a = some([resolve().then(function(){
                throw 1;
            }),reject(3),reject(5),reject(7),reject(9)]);
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
        it('should work when all are rejected including a nested one',function(){
             var a = some([resolve().then(function(){
                return reject(1);
            }),reject(3),reject(5),reject(7),reject(9)]);
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
    });
    describe('async',function(){
        it('should work',function(){
            var a = some(resolve([resolve(1),resolve(3),resolve(5),resolve(7),resolve(9)]));
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work mixed',function(){
            var a = some(resolve([resolve(1),3,resolve(5),resolve(7),resolve(9)]));
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work with a rejection',function(){
            var a = some(resolve([resolve(1),reject(3),resolve(5),resolve(7),resolve(9)]));
            return all([a.should.eventually.include.members([1,5,7,9]),a.should.eventually.have.length(4)]);
        });
        it('should work with nested values',function(){
            var a = some(resolve([resolve(resolve(1)),resolve(3),resolve(5),resolve(7),resolve(9)]));
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work with very nested values',function(){
            var a = some(resolve([resolve().then(function(){
                return resolve(1);
            }),resolve(3),resolve(5),resolve(7),resolve(9)]));
            return all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
        });
        it('should work when all are rejected',function(){
             var a = some(resolve([reject(1),reject(3),reject(5),reject(7),reject(9)]));
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
        it('should work when all are rejected including a thrown then',function(){
             var a = some(resolve([resolve().then(function(){
                throw 1;
            }),reject(3),reject(5),reject(7),reject(9)]));
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
        it('should work when all are rejected including a nested one',function(){
             var a = some(resolve([resolve().then(function(){
                return reject(1);
            }),reject(3),reject(5),reject(7),reject(9)]));
            return all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
        });
    });
});
