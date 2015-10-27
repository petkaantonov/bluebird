---
layout: api
id: throw
title: .throw
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.throw

```js
.throw(any reason) -> Promise
```
```js
.thenThrow(any reason) -> Promise
```


Convenience method for:

```js
.then(function() {
   throw reason;
});
```

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).

*For compatibility with earlier ECMAScript version, an alias `.thenThrow` is provided for [`.throw`](.).*
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".throw";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-throw";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>