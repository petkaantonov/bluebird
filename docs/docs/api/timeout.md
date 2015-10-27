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

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".timeout";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-timeout";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
