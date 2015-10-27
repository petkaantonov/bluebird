---
layout: api
id: filter
title: .filter
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.filter

```js
.filter(
    function(any item, int index, int length) filterer,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Same as [Promise.filter(this, filterer, options)](.).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".filter";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-filter";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>