---
layout: api
id: promise.concurrency
title: Promise.concurrency
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.concurrency

```js
Promise.concurrency(
    [Object {concurrency: int=Infinity} options],
    [any|Promise<any> value=undefined]
) -> Promise
```

Sets the thread limit in your promise chain for any subsequent `.filter()` or `.map()`.
This will prevent CPU exhaustion or excess resource contention.

```js
var leadData = Promise
    .resolve(fetch('/leads'))
    .concurrency(4)
    .map(lead => {//<- Parallel map (4x)
        return {
            messages: getMessages(lead),
            stats: getStats(lead)
        }
    })
    .concurrency(8)
    .filter(leadData => leadData.messages.length >= 1)//<- Highly parallel (8x)
    .concurrency(1)
    .map(leadData => addToTable(leadData))//<- Not parallel, UI bound (1x)
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.concurrency";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.concurrency";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>