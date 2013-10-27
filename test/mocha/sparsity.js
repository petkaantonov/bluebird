"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

var arr = [
    ,,,Promise.fulfilled(),,,
];

function assertSameSparsity(input) {
    assert.deepEqual(arr, arrCopy);
    for( var i = 0, len = input.length; i < len; ++i ) {
         if( i === 3 ) {
             assert( ( i in input ) );
         }
         else {
             assert( !( i in input ) );
         }

    }
}

var arrCopy = [,,,arr[3],,,]

describe("When using a sparse array the resulting array should have equal sparsity when using", function() {

    specify("Settle", function(done) {
        Promise.settle(arr).then(function(c){
            assertSameSparsity(c);
            done();
        });
    });

    specify("All", function(done) {
        Promise.all(arr).then(function(c){
            assertSameSparsity(c);
            done();
        });
    });

    specify("Map", function(done) {
        Promise.map(arr, function( v ){
            return v;
        }).then(function(c){
            assertSameSparsity(c);
            done();
        });
    });

    specify("Reduce", function(done) {
        var indices = [];

        var calls = 0;
        function semidone() {
            if( ( ++calls ) === 2 ) {
                done();
            }
        }

        Promise.reduce(arr, function( total, prev, i ){
            assert.fail();
        }).then(function(v){
            assert.equal(v, void 0);
            semidone();
        });

        Promise.reduce(arr, function( total, prev, i ){
            indices.push(i);
            return total;
        }, 5).then(function(ret){
            assert.equal(indices.length, 1);
            assert.equal(indices[0], 3);
            assert.equal(ret, 5);
            semidone();
        });
    });

});

