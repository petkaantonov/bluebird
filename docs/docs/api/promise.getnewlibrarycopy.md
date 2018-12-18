---
layout: api
id: promise.getnewlibrarycopy
title: Promise.getNewLibraryCopy
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.getNewLibraryCopy

```js
Promise.getNewLibraryCopy() -> Object
```

Returns a new independent copy of the Bluebird library.

This method should be used before you use any of the methods which would otherwise alter the global `Bluebird` object - to avoid polluting global state.

A basic example:

```js
var Promise = require('bluebird');
var Promise2 = Promise.getNewLibraryCopy();

Promise2.x = 123;

console.log(Promise2 == Promise); // false
console.log(Promise2.x); // 123
console.log(Promise.x); // undefined
```

`Promise2` is independent to `Promise`. Any changes to `Promise2` do not affect the copy of Bluebird returned by `require('bluebird')`.

In practice:

```js
var Promise = require('bluebird').getNewLibraryCopy();

Promise.coroutine.addYieldHandler( function() { /* */ } ); // alters behavior of `Promise.coroutine()`

// somewhere in another file or module in same app
var Promise = require('bluebird');

Promise.coroutine(function*() {
    // this code is unaffected by the yieldHandler defined above
    // because it was defined on an independent copy of Bluebird
});
```
</markdown></div>
