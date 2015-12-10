---
layout: api
id: promise.monitor
title: Promise.monitor
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.monitor

```js
Promise.enableMonitoring() -> undefined
```

Call this method to enable promises monitoring feature. Monitoring implies performance penalty.

Promises monitoring feature allows to see list of all pending promises at any moment. After the feature have been enabled Promise.getPendingPromises() method can be called at any moment to examine all pending promises objects.

Promise.getLeafPendingPromises() method can be called at any moment to examine only the pending promises at the end of promise chains.

Monitoring feature can be disabled by calling Promise.disableMonitoring().

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.monitor";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.monitor";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
