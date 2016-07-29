---
layout: api
id: value
title: .value
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.value

```js
.value() -> any
```


Get the fulfillment value of this promise. Throws an error if the promise isn't fulfilled - it is a bug to call this method on an unfulfilled promise.

You should check if this promise is [.isFulfilled()](.) in code paths where it's not guaranteed that this promise is fulfilled.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".value";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-value";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
