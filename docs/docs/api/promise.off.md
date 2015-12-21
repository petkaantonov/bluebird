---
layout: api
id: promise.off
title: Promise.off
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.off

```js
Promise.off(String eventName("created"|"chained"|"fulfilled"|"rejected"|"following"|"cancelled"), Function handler) -> undefined
```
Removes a handler form promise lifecycle event (see: [on](promise.on.html).
Given event name and handler function that were used for subscription, removes the subscription.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.onPossiblyUnhandledRejection";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.onpossiblyunhandledrejection";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
