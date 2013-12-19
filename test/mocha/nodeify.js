"use strict";

var assert = require("assert");

var adapter = require("../../js/debug/bluebird.js");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var Promise = adapter;

describe("Promise.nodeify", function(){
	it("should used resolved results in nodeify callback", function (done) {
		var defered = Promise.defer();

		defered.promise.then(function (value) {
			var nested = Promise.defer();
			
			setTimeout(function () {
				nested.resolve(value * 2);
			}, 10);

			return _defered;
		}).nodeify(function (err, value) {
			assert(value === 20);
			done();
		});

		setTimeout(function () {
			defered.resolve(10);
		}, 10);
	});
});