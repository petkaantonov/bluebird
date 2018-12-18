---
layout: api
id: timeout
title: .timeout
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.timeout

```js
.timeout(
    int ms,
    [String message="operation timed out"]
) -> Promise
```
```js
.timeout(
    int ms,
    [Error error]
) -> Promise
```


Returns a promise that will be fulfilled with this promise's fulfillment value or rejection reason. However, if this promise is not fulfilled or rejected within `ms` milliseconds, the returned promise is rejected with a [`TimeoutError`](.) or the `error` as the reason.

When using the first signature, you may specify a custom error message with the `message` parameter.


```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require('fs'));
fs.readFileAsync("huge-file.txt").timeout(100).then(function(fileContents) {

}).catch(Promise.TimeoutError, function(e) {
    console.log("could not read file within 100ms");
});
```
</markdown></div>
