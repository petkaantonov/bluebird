---
layout: api
id: return
title: .return
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.return

```js
.return(any value) -> Promise
```
```js
.thenReturn(any value) -> Promise
```

Convenience method for:

```js
.then(function() {
   return value;
});
```

in the case where `value` doesn't change its value because its binding time is different than when using a closure.

That means `value` is bound at the time of calling [`.return`](.) so this will not work as expected:

```js
function getData() {
    var data;

    return query().then(function(result) {
        data = result;
    }).return(data);
}
```

because `data` is `undefined` at the time `.return` is called.

Function that returns the full path of the written file:

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var baseDir = process.argv[2] || ".";

function writeFile(path, contents) {
    var fullpath = require("path").join(baseDir, path);
    return fs.writeFileAsync(fullpath, contents).thenReturn(fullpath);
}

writeFile("test.txt", "this is text").then(function(fullPath) {
    console.log("Successfully file at: " + fullPath);
});
```

*For compatibility with earlier ECMAScript version, an alias `.thenReturn` is provided for [`.return`](.).*
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".return";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-return";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>