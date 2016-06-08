---
layout: api
id: promise.using
title: Promise.using
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.using

```js
Promise.using(
    Promise|Disposer|any resource,
    Promise|Disposer|any resource...,
    function(any resources...) handler
) -> Promise
```
```js
Promise.using(
    Array<Promise|Disposer|Any> resources,
    function(Array<any> resources) handler
) -> Promise
```


In conjunction with [`.disposer`](.), `using` will make sure that no matter what, the specified disposer will be called when the promise returned by the callback passed to `using` has settled. The disposer is necessary because there is no standard interface in node for disposing resources.

Here is a simple example (where `getConnection()` has been defined to return a proper Disposer object)

```js
using(getConnection(), function(connection) {
   // Don't leak the `connection` variable anywhere from here
   // it is only guaranteed to be open while the promise returned from
   // this callback is still pending
   return connection.queryAsync("SELECT * FROM TABLE");
   // Code that is chained from the promise created in the line above
   // still has access to `connection`
}).then(function(rows) {
    // The connection has been closed by now
    console.log(rows);
});
```

Using multiple resources:

```js
using(getConnection(), function(conn1) {
    return using(getConnection(), function(conn2) {
        // use conn1 and conn 2 here
    });
}).then(function() {
    // Both connections closed by now
})
```

The above can also be written as (with a caveat, see below)

```js
using(getConnection(), getConnection(), function(conn1, conn2) {
    // use conn1 and conn2
}).then(function() {
    // Both connections closed by now
})
```

However, if the second `getConnection` throws **synchronously**, the first connection is leaked. This will not happen
when using APIs through bluebird promisified methods though. You can wrap functions that could throw in [`Promise.method`](.) which will turn synchronous rejections into rejected promises.

Note that you can mix promises and disposers, so that you can acquire all the things you need in parallel instead of sequentially

```js
// The files don't need resource management but you should
// still start the process of reading them even before you have the connection
// instead of waiting for the connection

// The connection is always closed, no matter what fails at what point
using(readFile("1.txt"), readFile("2.txt"), getConnection(), function(txt1, txt2, conn) {
    // use conn and have access to txt1 and txt2
});
```


<hr>

You can also pass the resources in an array in the first argument. In this case the handler function will only be called with one argument that is the array containing the resolved resources in respective positions in the array. Example:

```js
var connectionPromises = [getConnection(), getConnection()];

using(connectionPromises, function(connections) {
    var conn1 = connections[0];
    var conn2 = connections[1];
    // use conn1 and conn2
}).then(function() {
    // Both connections closed by now
})

```


</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.using";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.using";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
