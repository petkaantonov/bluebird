---
layout: api
id: catchreturn
title: .catchReturn
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.catchReturn

```js
.catchReturn(
    [class ErrorClass|function(any error) predicate],
    any value
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   return value;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `value` to apply as with [`.return`](.).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".catchReturn";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-catchreturn";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>