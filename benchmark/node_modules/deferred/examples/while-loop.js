'use strict';

// While loops are usually constructruted as recurrent asynchronous functions:

var deferred = require('deferred')

  , count = 0, limit = 10, get;

get = function self() {
	var d = deferred();
	setTimeout(function () {
		d.resolve(++count);
	}, 500);
	return d.promise;
};

// Invoke while loop:
get().then(function self(value) {
	console.log(value);
	if (value < limit) return get().then(self);
	return value;
}).done(function () {
	console.log("Done!");
});
