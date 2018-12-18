---
layout: api
id: promiseinspection
title: PromiseInspection
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##PromiseInspection

```js
interface PromiseInspection {
    any reason()
    any value()
    boolean isPending()
    boolean isRejected()
    boolean isFulfilled()
    boolean isCancelled()
}
```

This interface is implemented by `Promise` instances as well as the `PromiseInspection` result given by [.reflect()](.).
</markdown></div>
