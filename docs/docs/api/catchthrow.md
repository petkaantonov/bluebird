---
layout: api
id: catchthrow
title: .catchThrow
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.catchThrow

```js
.catchThrow(
    [class ErrorClass|function(any error) predicate],
    any reason
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   throw reason;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).
</markdown></div>
