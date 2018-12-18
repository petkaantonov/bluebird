---
layout: api
id: promise.any
title: Promise.any
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.any

```js
Promise.any(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Like [Promise.some](.), with 1 as `count`. However, if the promise fulfills, the fulfillment value is not an array of 1 but the value directly.
</markdown></div>
