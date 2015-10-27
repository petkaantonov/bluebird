---
layout: api
id: deferred-migration
title: Deferred migration
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Deferred migration

Deferreds are deprecated in favor of the promise constructor. If you need deferreds for some reason, you can create them trivially using the constructor:

```js
function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}
```

For old code that still uses deferred objects, see [the deprecated API docs ](/bluebird/web/docs/deprecated_apis.html#promise-resolution).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Deferred migration";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-deferred-migration";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>