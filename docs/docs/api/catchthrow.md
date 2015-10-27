---
layout: api
id: catchthrow
title: .catchThrow
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.catchThrow

```js
.catchThrow(
    [class ErrorClass|function(any error) predicate],
    any reason
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   throw reason;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".catchThrow";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-catchthrow";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>