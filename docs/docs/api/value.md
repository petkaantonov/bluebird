---
layout: api
id: value
title: .value
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.value

```js
.value() -> any
```


Get the fulfillment value of this promise. Throws an error if the promise isn't fulfilled - it is a bug to call this method on an unfulfilled promise.

You should check if this promise is [.isFulfilled()](.) in code paths where it's not guaranteed that this promise is fulfilled.
</markdown></div>

