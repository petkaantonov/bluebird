---
id: working-with-callbacks
title: Working With Callbacks
---

This page explains how to interface your code with existing callback APIs and libraries you're using. We'll see that making bluebird work with callback APIs is not only easy - it's also fast.

We'll cover several subjects. If you want to get the tl;dr what you need is likely the [Working with callback APIs using the Node convention](#working-with-callback-apis-using-the-node-convention) section.

 * [Automatic vs. Manual conversion](#automatic-vs.-manual-conversion)
 * [Working with callback APIs using the Node convention](#working-with-callback-apis-using-the-node-convention)
 * [Working with one time events.](#working-with-one-time-events)
 * [Working with delays](#working-with-delays)
 * [Working with browser APIs](#working-with-browser-apis)
 * [Working with databases](#working-with-databases)
 * [Working with any other APIs](#working-with-any-other-apis)

There is also [this more general StackOverflow question](http://stackoverflow.com/questions/22519784/how-do-i-convert-an-existing-callback-api-to-promises) about conversion of callback APIs to promises. If you find anything missing in this guide however, please do open an issue or pull request.

###Automatic vs. Manual conversion

There are two primary methods of converting callback based APIs into promise based ones. You can either manually map the API calls to promise returning functions or you can let the bluebird do it for you. We **strongly** recommend the latter.

Promises provide a lot of really cool and powerful guarantees like throw safety which are hard to provide when manually converting APIs to use promises. Thus, whenever it is possible to use the `Promise.promisify` and `Promise.promisifyAll` methods - we recommend you use them. Not only are they the safest form of conversion - they also use techniques of dynamic recompilation to introduce very little overhead.

###Working with callback APIs using the Node convention

In Node/io.js most APIs follow a convention of 'error-first, single-parameter' as such:

```js
function getStuff(dat,callback){
...
getStuff("dataParam",function(err,data){

}
```

This APIs are what most core modules in Node/io use and bluebird comes with a fast and efficient way to convert them to promise based APIs through the `Promise.promisify` and `Promise.promisifyAll` function calls.

 - [`Promise.promisify`](/api-reference.html#promise.promisify) - converts a _single_ callback taking function into a promise returning function. It does not alter the original function and returns the modified version.
 - [`Promise.promisifyAll`](/api-reference.html#promise.promisifyall) - takes an _object_ full of functions and _converts each function_ into the new one with the `Async` suffix (by default). It does not change the original functions but instead adds new ones.

> **Note** - please check the linked docs for more parameters and usage examples.

Here's an example of `fs.readFile` with or without promises:

```js
// callbacks
var fs = require("fs");
fs.readFile("name", "utf8", function(err, data){

});
```

Promises:

```js
var fs = Promise.promisifyAll(require("fs"));
fs.readFileAsync("name", "utf8").then(function(data){

});
```

Note the async suffix was added. Single functions can also be promisified for example:

```js
var request = Promise.promisify(require("request"));
request("foo.bar").then(function(result){

});
```

> **Note** `Promise.promisify` and `Promise.promisifyAll` use dynamic recompilation for really fast wrappers and thus calling them should be done only once. [`Promise.fromCallback`](/api-reference.html#promise.fromcallback) exists for cases this is not possible.

###Working with one time events
###Working with delays
###Working with browser APIs
###Working with databases
###Working with any other APIs