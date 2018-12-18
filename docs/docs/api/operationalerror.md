---
layout: api
id: operationalerror
title: OperationalError
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##OperationalError

```js
new OperationalError(String message) -> OperationalError
```


Represents an error is an explicit promise rejection as opposed to a thrown error. For example, if an error is errbacked by a callback API promisified through [`Promise.promisify`](.) or [`Promise.promisifyAll`](.)
and is not a typed error, it will be converted to a `OperationalError` which has the original error in the `.cause` property.

`OperationalError`s are caught in [`.error`](.) handlers.
</markdown></div>

