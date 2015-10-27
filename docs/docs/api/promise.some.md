---
layout: api
id: promise.some
title: Promise.some
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.some

```js
Promise.some(
    Iterable<any>|Promise<Iterable<any>> input,
    int count
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and return a promise that is fulfilled as soon `count` promises are fulfilled in the array. The fulfillment value is an array with `count` values in the order they were fulfilled.

This example pings 4 nameservers, and logs the fastest 2 on console:

```js
Promise.some([
    ping("ns1.example.com"),
    ping("ns2.example.com"),
    ping("ns3.example.com"),
    ping("ns4.example.com")
], 2).spread(function(first, second) {
    console.log(first, second);
});
```

If too many promises are rejected so that the promise can never become fulfilled, it will be immediately rejected with an [AggregateError](.) of the rejection reasons in the order they were thrown in.

You can get a reference to [AggregateError](.) from `Promise.AggregateError`.

```js
Promise.some(...)
    .then(...)
    .then(...)
    .catch(Promise.AggregateError, function(err) {
        err.forEach(function(e) {
            console.error(e.stack);
        });
    });
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.some";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.some";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>