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

function assertEmptySparsity(input) {
    assert(input !== arrSparseEmpty);
    assert(input.length === arrSparseEmpty.length);
    for( var i = 0, len = input.length; i < len; ++i ) {
        assert( !( i in input ) );
    }
}

var arrSparseEmpty = [,,,,,,,,,,];

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

    specify("Settle with empty", function(done) {
        Promise.settle(arrSparseEmpty).then(function(c){
            assertEmptySparsity(c);
            done();
        });
    });

    specify("All with empty", function(done) {
        Promise.all(arrSparseEmpty).then(function(c){
            assertEmptySparsity(c);
            done();
        });
    });
});

