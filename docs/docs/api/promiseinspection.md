---
layout: api
id: promiseinspection
title: PromiseInspection
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##PromiseInspection

```js
interface PromiseInspection {
    any reason()
    any value()
    boolean isPending()
    boolean isRejected()
    boolean isFulfilled()
    boolean isCancelled()
}
```

This interface is implemented by `Promise` instances as well as the `PromiseInspection` result given by [.reflect()](.).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "PromiseInspection";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promiseinspection";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>