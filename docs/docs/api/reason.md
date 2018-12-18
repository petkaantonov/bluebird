---
layout: api
id: reason
title: .reason
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.reason

```js
.reason() -> any
```


Get the rejection reason of this promise. Throws an error if the promise isn't rejected - it is a bug to call this method on an unrejected promise.

You should check if this promise is [.isRejected()](.) in code paths where it's guaranteed that this promise is rejected.

<hr>
</markdown></div>
