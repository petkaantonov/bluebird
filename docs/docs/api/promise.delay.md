---
layout: api
id: promise.delay
title: Promise.delay
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.delay

```js
Promise.delay(
    int ms,
    [any|Promise<any> value=undefined]
) -> Promise
```


Returns a promise that will be resolved with `value` (or `undefined`) after given `ms` milliseconds. If `value` is a promise, the delay will start counting down when it is fulfilled and the returned promise will be fulfilled with the fulfillment value of the `value` promise.

```js
Promise.delay(500).then(function() {
    console.log("500 ms passed");
    return "Hello world";
}).delay(500).then(function(helloWorldString) {
    console.log(helloWorldString);
    console.log("another 500 ms passed") ;
});
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.delay";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.delay";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>