---
id: what-about-generators
title: What About Generators?
---

## Promises compliment generators and coroutines!

A lot of people tend to think that generators/coroutines are two different ways of modelling asynchronous behavior.

They're not!

With the use of `Promise.coroutine()` we can turn any `GeneratorFunction` constructor (any generator) into a coroutine
that yields resolves promises! (Those of you who are familiar with the `await/async` syntax from C# might get a slight
deja-vu)

```javascript
let myAsyncFn = Promise.coroutine(function*() {
	try {
		let [urlResponse, urlBody] = yield request.getAsync("http://some.api.com/url");
		if (urlResponse.code !== 200) { throw new Error('Getting URL failed! Got ' + urlResponse.code); }
		urlObj = JSON.parse(urlBody);
		let [apiResponse, apiBody] = yield request.getAsync(urlObj.url);
		if (apiResponse.code !== 200) { throw new Error('API call failed! Got ' + apiResponse.code); }
		return JSON.parse(apiBody); 
	}
	catch (err) {
		console.log("Had an error!", err);
	}
});
```

`myAsyncFn` is now a normal function, that returns a promise, in this case, the promise will resolve with the response
from the API call of the URL gotten from http://some.api.com/url

The above is equivalent to

```javascript
function myAsyncFn() {
	return request.getAsync("http://some.api.com/url")
		.then(([urlResponse, urlBody]) => {
			if (urlResponse.code !== 200) { return Promise.reject( new Error('Getting URL failed! Got ' + urlResponse.code)); }
			return JSON.parse(urlBody);
		})
		.then(urlObj => request.getAsync(urlObj.url))
		.then(([apiResponse, apiBody]) => {
			if (apiResponse.code !== 200) { return Promise.reject(new Error('API call failed! Got ' + apiResponse.code)); }
			return JSON.parse(apiBody);
		})
		.catch(err => console.log("Had an error!", err));
}
```

So basically, it makes our asynchronous function read like a normal, synchronous function, while keeping all of the
qualities of Promise based API.

## Keeping track of things

Coroutines are also a great way of keeping track of the various variables and values of resolved promises along the chain.

For example, in the above snippets, you'd be able to access `urlObj` anywhere after it's defined in the coroutine example, but
you'd have to jump through hoops to use it anywhere outside of its designated `.then()` handler in a normal promise chain.