'use strict';
var quickmap = require('../lib/quickMap');
var chai = require('chai');
chai.should();
describe("quickmap", function() {
    it('should work',function(){
        quickmap([1,2,3,4,5],function(a){
            return a*a;
        }).should.deep.equal([1,4,9,16,25]);
    });
    it('should work with an empty array',function(){
        quickmap([],function(a){
            return a*a;
        }).should.deep.equal([]);
    });
    it('should work with no function',function(){
        function mapArgs(){
            return quickmap(arguments);
        }
        mapArgs(1,2,3,4,5,6).should.deep.equal([1,2,3,4,5,6]);
    });
});
