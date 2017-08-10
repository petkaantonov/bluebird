---
layout: api
id: all
title: .all
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.all

```js
.all() -> Promise
```

Consume the resolved [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) and wait for all items to fulfill similar to [Promise.all()](.).

[Promise.resolve(iterable).all()](.) is the same as [Promise.all(iterable)](.).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".all";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-all";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
