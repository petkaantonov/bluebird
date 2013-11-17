'use strict';
var cast = require('../lib/cast');
var resolve = require('lie-resolve');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("cast",function(){
    it('should work with a value',function(){
        return cast(1).should.become(1);
    });
    it('should work with a promise',function(){
        return cast(resolve(1)).should.become(1);
    });
});