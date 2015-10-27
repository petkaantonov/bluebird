---
layout: api
id: done
title: .done
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.done

```js
.done(
    [function(any value) fulfilledHandler],
    [function(any error) rejectedHandler]
) -> undefined
```


Like [`.then`](.), but any unhandled rejection that ends up here will crash the process (in node) or be thrown as an error (in browsers). The use of this method is heavily discouraged and it only exists for historical reasons.

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".done";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-done";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>