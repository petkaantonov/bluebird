---
layout: api
id: promise.join
title: Promise.join
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.join

```js
Promise.join(
    Promise<any>|any values...,
    function handler
) -> Promise
```


For coordinating multiple concurrent discrete promises. While [`.all`](.) is good for handling a dynamically sized list of uniform promises, `Promise.join` is much easier (and more performant) to use when you have a fixed amount of discrete promises that you want to coordinate concurrently, for example:

```js
var Promise = require("bluebird");
var join = Promise.join;

join(getPictures(), getComments(), getTweets(),
    function(pictures, comments, tweets) {
    console.log("in total: " + pictures.length + comments.length + tweets.length);
});
```

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var pg = require("pg");
Promise.promisifyAll(pg, {
    filter: function(methodName) {
        return methodName === "connect"
    },
    multiArgs: true
});
// Promisify rest of pg normally
Promise.promisifyAll(pg);
var join = Promise.join;
var connectionString = "postgres://username:password@localhost/database";

var fContents = fs.readFileAsync("file.txt", "utf8");
var fStat = fs.statAsync("file.txt");
var fSqlClient = pg.connectAsync(connectionString).spread(function(client, done) {
    client.close = done;
    return client;
});

join(fContents, fStat, fSqlClient, function(contents, stat, sqlClient) {
    var query = "                                                              \
        INSERT INTO files (byteSize, contents)                                 \
        VALUES ($1, $2)                                                        \
    ";
   return sqlClient.queryAsync(query, [stat.size, contents]).thenReturn(query);
})
.then(function(query) {
    console.log("Successfully ran the Query: " + query);
})
.finally(function() {
    // This is why you want to use Promise.using for resource management
    if (fSqlClient.isFulfilled()) {
        fSqlClient.value().close();
    }
});
```

*Note: In 1.x and 0.x `Promise.join` used to be a `Promise.all` that took the values in as arguments instead in an array. This behavior has been deprecated but is still supported partially - when the last argument is an immediate function value the new semantics will apply*
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.join";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.join";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>