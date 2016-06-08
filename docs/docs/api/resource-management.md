---
layout: api
id: resource-management
title: Resource management
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Resource management

Managing resources properly without leaks can be challenging. Simply using `.finally` is not enough as the following example demonstrates:

```js
function doStuff() {
    return Promise.all([
        connectionPool.getConnectionAsync(),
        fs.readFileAsync("file.sql", "utf8")
    ]).spread(function(connection, fileContents) {
        return connection.query(fileContents).finally(function() {
            connection.close();
        });
    }).then(function() {
        console.log("query successful and connection closed");
    });
}
```

It is very subtle but over time this code will exhaust the entire connection pool and the server needs to be restarted. This is because
reading the file may fail and then of course `.spread` is not called at all and thus the connection is not closed.

One could solve this by either reading the file first or connecting first, and only proceeding if the first step succeeds. However,
this would lose a lot of the benefits of using asynchronity and we might almost as well go back to using simple synchronous code.

We can do better, retaining concurrency and not leaking resources, by using:

* [disposers](disposer.html), objects that wrap a resource and a method to release that resource, together with  
* [`Promise.using`](promise.using.html), a function to safely use disposers in a way that automatically calls their release method

```js
var using = Promise.using;

using(getConnection(),
      fs.readFileAsync("file.sql", "utf8"), function(connection, fileContents) {
    return connection.query(fileContents);
}).then(function() {
    console.log("query successful and connection closed");
});
```

Continue by reading about [disposers](disposer.html) and [`Promise.using`](promise.using.html)

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Resource management";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-resource-management";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
