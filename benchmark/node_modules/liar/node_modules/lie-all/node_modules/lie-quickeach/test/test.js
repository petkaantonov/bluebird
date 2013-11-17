'use strict';
var quickeach = require('../lib/quickEach');
var chai = require('chai');
chai.should();
describe("quickeach", function() {
    it('should work',function(){
        var out = [];
        quickeach([1,2,3,4,5],function(a){
            out.push(a*a);
        });
        out.should.deep.equal([1,4,9,16,25]);
    });
    it('should work with an empty array',function(){
        var out = [];
        quickeach([],function(a){
            out.push(a*a);
        })
        out.should.deep.equal([]);
    });
});
