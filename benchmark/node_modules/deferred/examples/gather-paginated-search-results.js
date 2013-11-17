'use strict';

// Let's say we're after content that is paginated over many pages on some
// website (like search results). We don't know how many pages it spans.
// We only know by reading page n whether page n + 1 exists.

// 1. Define simple download function, it downloads page at given path from
//    predefinied domain and returns promise:

var deferred = require('deferred')
  , http = require('http')

  , getPage, n, result = {};

getPage = function (path) {
	var d = deferred();

	http.get({
		host: 'www.example.com',
		path: path
	}, function (res) {
		res.setEncoding('utf-8');
		var content = "";
		res.on('data', function (data) {
			content += data;
		});
		res.on('end', function () {
			d.resolve(content);
		});
	}).on('error', d.reject);

	return d.promise;
};

// 2. Invoke promise loop

n = 1;
getPage('/page/' + n)(function process(content) {
	var isNextPage = false;
	// ...populate result...

	// ...decide whether we need to download next page

	if (isNextPage) return getPage('/page/' + (++n))(process);
	return result;
}).done(function (result) {
	// process final result
});
