---
layout: api
id: call
title: .call
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.call

```js
.call(
    String methodName,
    [any args...]
)
```

This is a convenience method for doing:

```js
promise.then(function(obj) {
    return obj[methodName].call(obj, arg...);
});
```

For example ([`some` is a built-in array method](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some)):

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");
var thisPath = process.argv[2] || ".";
var now = Date.now();

fs.readdirAsync(thisPath)
    .map(function(fileName) {
        return fs.statAsync(path.join(thisPath, fileName));
    })
    .call("some", function(stat) {
        return (now - new Date(stat.mtime)) < 10000;
    })
    .then(function(someFilesHaveBeenModifiedLessThanTenSecondsAgo) {
        console.log(someFilesHaveBeenModifiedLessThanTenSecondsAgo) ;
    });
```

Chaining lo-dash or underscore methods (Copy-pasteable example):

```js
var Promise = require("bluebird");
var pmap = Promise.map;
var props = Promise.props;
var _ = require("lodash");
var fs = Promise.promisifyAll(require("fs"));

function getTotalSize(paths) {
    return pmap(paths, function(path) {
        return fs.statAsync(path).get("size");
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
}

fs.readdirAsync(".").then(_)
    .call("groupBy", function(fileName) {
        return fileName.charAt(0);
    })
    .call("map", function(fileNames, firstCh) {
        return props({
            firstCh: firstCh,
            count: fileNames.length,
            totalSize: getTotalSize(fileNames)
        });
    })
    // Since the currently wrapped array contains promises we need to unwrap it and call .all() before continuing the chain
    // If the currently wrapped thing was an object with properties that might be promises, we would call .props() instead
    .call("value").all().then(_)
    .call("sortBy", "count")
    .call("reverse")
    .call("map", function(data) {
        return data.count + " total files beginning with " + data.firstCh + " with total size of " + data.totalSize + " bytes";
    })
    .call("join", "\n")
    .then(console.log)
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".call";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-call";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>