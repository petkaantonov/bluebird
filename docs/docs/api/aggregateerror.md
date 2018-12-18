---
layout: api
id: aggregateerror
title: AggregateError
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##AggregateError

```js
new AggregateError() extends Array -> AggregateError
```


A collection of errors. `AggregateError` is an array-like object, with numeric indices and a `.length` property. It supports all generic array methods such as `.forEach` directly.

`AggregateError`s are caught in [`.error`](.) handlers, even if the contained errors are not operational.

[Promise.some](.) and [Promise.any](.)  use `AggregateError` as rejection reason when they fail.


Example:

```js
//Assumes AggregateError has been made global
var err = new AggregateError();
err.push(new Error("first error"));
err.push(new Error("second error"));
throw err;
```

<hr>
</markdown></div>
