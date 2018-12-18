---
layout: api
id: tap
title: .tap
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.tap

```js
.tap(function(any value) handler) -> Promise
```
Essentially like `.then()`, except that the value passed in is the value returned.

This means you can insert `.tap()` into a `.then()` chain without affecting what is passed through the chain.  (See example below).

Unlike [`.finally`](.) this is not called for rejections.

```js
getUser().tap(function(user) {
    //Like in finally, if you return a promise from the handler
    //the promise is awaited for before passing the original value through
    return recordStatsAsync();
}).then(function(user) {
    //user is the user from getUser(), not recordStatsAsync()
});
```

Common case includes adding logging to an existing promise chain:

```js
doSomething()
    .then(...)
    .then(...)
    .then(...)
    .then(...)
```

```js
doSomething()
    .then(...)
    .then(...)
    .tap(console.log)
    .then(...)
    .then(...)
```

*Note: in browsers it is necessary to call `.tap` with `console.log.bind(console)` because console methods can not be called as stand-alone functions.*
</markdown></div>

