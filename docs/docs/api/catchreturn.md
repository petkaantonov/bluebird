---
layout: api
id: catchreturn
title: .catchReturn
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.catchReturn

```js
.catchReturn(
    [class ErrorClass|function(any error) predicate],
    any value
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   return value;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `value` to apply as with [`.return`](.).
</markdown></div>
