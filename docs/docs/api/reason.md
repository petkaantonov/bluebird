---
layout: api
id: reason
title: .reason
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.reason

```js
.reason() -> any
```


Get the rejection reason of this promise. Throws an error if the promise isn't rejected - it is a bug to call this method on an unrejected promise.

You should check if this promise is [.isRejected()](.) in code paths where it's guaranteed that this promise is rejected.

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".reason";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-reason";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>