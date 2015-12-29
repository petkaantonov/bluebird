---
id: coming-from-other-libraries
title: Coming from Other Libraries
---

This page is a reference for migrating to bluebird from other flow control or promise libraries. See [installation](install.html) on how to use bluebird in your environment.

 - [Coming from native promises](#coming-from-native-promises)
 - [Coming from jQuery deferreds](#coming-from-jquery-deferreds)
 - [Coming from `async` module](#coming-from-async-module)
 - [Coming from Q](#coming-from-q)
 - [Coming from co/koa](#coming-from-co)
 - [Coming from highland, RxJS or BaconJS](#coming-from-highland)

##Coming from native promises

Bluebird promises are a drop-in replacement for native promises except for subclassing. Additionally you might want to replace usages of the often incorrectly used [Promise.race](.) with bluebird's [Promise.any](.) which does what is usually mistakenly expected from [Promise.race](.). For maximum compatibility, bluebird does provide [Promise.race](.) with ES6 semantics.

You can also refactor some looping patterns to a more natural form that would [leak memory when using native promises](https://github.com/promises-aplus/promises-spec/issues/179).

##Coming from jQuery deferreds

Bluebird treats jQuery deferreds and promises interchangeably. Wherever you can take a promise or return a promise, you can take or return a jQuery deferred instead and it works the same.

For instance, there is no need to write something like this:

```js
var firstRequest = new Promise(function(resolve, reject) {
    $.ajax({...}).done(resolve).fail(reject);
});
var secondRequest = new Promise(function(resolve, reject) {
    $.ajax({...}).done(resolve).fail(reject);
});

Promise.all([firstRequest, secondRequest]).then(function() {
    // ...
});
```

Since [Promise.all](.) takes promises, it must also take jQuery deferreds, so the above can be shortened to:

```js
var firstRequest = $.ajax({...});
var secondRequest = $.ajax({...});

Promise.all([firstRequest, secondRequest]).then(function() {
    // ...
});
```

That said, if you have code written using jQuery deferred methods, such as `.then`, `.done` and so on, you cannot drop-in replace the jQuery deferred with a bluebird promise in that code. Despite having the same names, jQuery deferred methods have different semantics than bluebird promise methods. These differences are due to the completely different goals of the implementations. Bluebird is [an internal DSL](http://en.wikipedia.org/wiki/Domain-specific_language) for the domain of asynchronous control flow while jQuery deferreds are a callback aggregator utility ("glorified event emitters").

If you do have some code using jQuery deferred methods extensively try to see if some of these jQuery deferred patterns and their replacements can be applied:

```js
// jQuery
$.when.apply($, someArray).then(...)
// bluebird
Promise.all(someArray).then(...)
```

```js
// jQuery
var data = [1,2,3,4];
var processItemsDeferred = [];

for(var i = 0; i < data.length; i++) {
  processItemsDeferred.push(processItem(data[i]));
}

$.when.apply($, processItemsDeferred).then(everythingDone);

// bluebird
var data = [1,2,3,4];
Promise.map(data, function(item) {
    return processItem(item);
}).then(everythingDone);
```

```js
// jQuery
var d = $.Deferred();
d.resolve("value");
// bluebird
var d = Promise.resolve("value");
```

```js
// jQuery
var d = $.Deferred();
d.reject(new Error("error"));
// bluebird
var d = Promise.reject(new Error("error"));
```

```js
// jQuery
var clicked = $.Deferred();
$("body").one("click", function(e) {
    clicked.resolve(e);
});
// bluebird
var clicked = new Promise(function(resolve) {
    $("body").one("click", resolve);
});
```

```js
// jQuery
.always(removeSpinner);
// bluebird
.finally(removeSpinner);
```

##Coming from `async` module

When working with promises the philosophy is basically a complete opposite than when using `async`. Async provides a huge bag of uncomposable helper functions that work at a very low level of abstraction. When using promises you can get the utility otherwise provided by uncountable amount of inflexible helper functions by just combining and composing a few existing functions and concepts.

That means when you have a problem there probably isn't an existing function tailored exactly to that problem but instead you can just combine the existing utilities to arrive at a solution. The upside of this is that you don't need to come up with all these different functions to solve problems that are not that different from each other. The most important thing to do when migrating from async to bluebird is this profound shift in philosophy.

This section lists the most common async module replacements.

###`async.waterfall`

If the waterfall elements are static, you can just replace it with a normal promise chain. For waterfalls with dynamic steps, use [Promise.each](.). Multiple arguments can be ferried in an array.

Implementing the example from [async homepage](https://github.com/caolan/async#waterfalltasks-callback)

```js
async.waterfall([
    function(callback) {
        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
      // arg1 now equals 'one' and arg2 now equals 'two'
        callback(null, 'three');
    },
    function(arg1, callback) {
        // arg1 now equals 'three'
        callback(null, 'done');
    }
], function (err, result) {
    // result now equals 'done'
});
```

Since the array passed to waterfall is static (always the same 3 functions) a plain old promise chain is used:

```js
Promise.resolve(['one', 'two']).spread(function(arg1, arg2) {
    // arg1 now equals 'one' and arg2 now equals 'two'
    return 'three';
}).then(function(arg1) {
    // arg1 now equals 'three'
    return 'done';
}).then(function(result) {
    // result now equals 'done'
});
```

If destructuring parameters are supported, `.spread(function(arg1, arg2) {})` can be replaced with `.then(function([arg1, arg2]){})`.

###`async.series`

Using [Promise.mapSeries](.) to implement the example from [async homepage](https://github.com/caolan/async#seriestasks-callback):

```js
async.series([
    function(callback){
        setTimeout(function(){
            callback(null, 1);
        }, 200);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 2);
        }, 100);
    }
],
// optional callback
function(err, results){
    // results is now equal to [1, 2]
});
```

```js
Promise.mapSeries([{timeout: 200, value: 1},
                   {timeout: 100, value: 2}], function(item) {
    return Promise.delay(item.timeout, item.value);
}).then(function(results) {
    // results is now equal to [1, 2]
});
```


###`async.parallel`

Using [Promise.all](.) to implement the example from [async homepage](https://github.com/caolan/async#parallel):

```js
async.parallel([
    function(callback){
        setTimeout(function(){
            callback(null, 'one');
        }, 200);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 'two');
        }, 100);
    }
],
// optional callback
function(err, results){
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
});
```

```js
Promise.all([Promise.delay('one', 200),
             Promise.delay('two', 100)]).then(function(results) {
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
});
```

###`async.mapSeries`

Using [Promise.each](.) to implement the example from [async homepage](https://github.com/caolan/async#maparr-iterator-callback):

```js
var fs = require('fs');
async.mapSeries(['file1','file2','file3'], fs.stat, function(err, results){
    // results is now an array of stats for each file
});
```

```js
var fs = Promise.promisifyAll(require('fs'));
Promise.each(['file1','file2','file3'], function(fileName, index, length) {
    return fs.statAsync(fileName);
}).then(function(results) {
    // results is now an array of stats for each file
});
```

###`async.map`

Using [Promise.map](.) to implement the example from [async homepage](https://github.com/caolan/async#maparr-iterator-callback):

```js
var fs = require('fs');
async.map(['file1','file2','file3'], fs.stat, function(err, results){
    // results is now an array of stats for each file
});
```

```js
var fs = Promise.promisifyAll(require('fs'));
Promise.map(['file1','file2','file3'], function(fileName, index, length) {
    return fs.statAsync(fileName);
}).then(function(results) {
    // results is now an array of stats for each file
});
```

###`async.whilst`

Using recursion to implement the example from [async homepage](https://github.com/caolan/async#whilsttest-fn-callback):

```js
var count = 0;
async.whilst(
    function () { return count < 5; },
    function (callback) {
        count++;
        setTimeout(callback, 1000);
    },
    function (err) {
        // 5 seconds have passed
    }
);
```
```js
(function loop() {
    if (count < 5) {
        count++;
        return Promise.delay(1000).then(loop);
    }
    return Promise.resolve();
})().then(function() {
    // 5 seconds have passed
});
```

Be warned that the above example implementations are only superficially equivalent. Callbacks, even with the help of async, require too much boilerplate code to provide the same guarantees as promises.

##Coming from Q

Q and bluebird share a lot of common methods that nevertheless have different names:

- `Q(...)` -> [Promise.resolve()](.)
- `.fail()` -> [.catch()](.) or `.caught()`
- `.fin()` -> [.finally()](.) or `.lastly()`
- `Q.fcall()` -> [Promise.try](.) or `Promise.attempt()`
- `.thenResolve()` -> [.return()](.) or `.thenReturn()`
- `.thenReject()` -> [.throw()](.) or `thenThrow()`

##Coming from co/koa

In recent versions generator libraries started abandoning old ideas of special tokens passed to callbacks and started using promises for what's being yielded.

Bluebird's [Promise.coroutine](.) is a superset of the `co` library, being more extensible as well as supporting cancellation (in environments where [`Generator#return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) is implemented).

##Coming from highland, RxJS or BaconJS

Stream libraries tend to serve a different purpose than promise libraries. Unlike promise libraries streams can represent multiple values.

Check out the benchmarks section for examples of transitioning an API from Bacon/Rx to promises.
