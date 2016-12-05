---
layout: api
id: operationalerror
title: OperationalError
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##OperationalError

```js
new OperationalError(String message) -> OperationalError
```


Represents an error is an explicit promise rejection as opposed to a thrown error. For example, if an error is errbacked by a callback API promisified through [`Promise.promisify`](.) or [`Promise.promisifyAll`](.)
and is not a typed error, it will be converted to a `OperationalError` which has the original error in the `.cause` property.

`OperationalError`s are caught in [`.error`](.) handlers.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "OperationalError";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-operationalerror";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
