"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

describe("Promise.nodeify", function(){
	it("should used resolved results in nodeify callback", function (done) {
		fulfilled(10).then(function (value) {
			return value * 2;
		}).nodeify(function (value) {
			assert(value === 20);
			done();
		});
	});
});