---
layout: api
id: deferred-migration
title: Deferred migration
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Deferred migration

Deferreds are deprecated in favor of the promise constructor. If you need deferreds for some reason, you can create them trivially using the constructor:

```js
function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}
```

For old code that still uses deferred objects, see [the deprecated API docs ](//bluebirdjs.com/docs/deprecated-apis.html#promise-resolution).
</markdown></div>

