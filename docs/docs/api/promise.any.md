---
layout: api
id: promise.any
title: Promise.any
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.any

```js
Promise.any(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Like [Promise.some](.), with 1 as `count`. However, if the promise fulfills, the fulfillment value is not an array of 1 but the value directly.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.any";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.any";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>