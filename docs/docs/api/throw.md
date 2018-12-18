---
layout: api
id: throw
title: .throw
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.throw

```js
.throw(any reason) -> Promise
```
```js
.thenThrow(any reason) -> Promise
```


Convenience method for:

```js
.then(function() {
   throw reason;
});
```

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).

*For compatibility with earlier ECMAScript version, an alias `.thenThrow` is provided for [`.throw`](.).*
</markdown></div>
