---
layout: api
id: promise.each
title: Promise.each
---



[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.each

```js
Promise.each(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) iterator
) -> Promise
```

[api/promise.each](unfinished-article)

Iterate over an array, or a promise of an array, which contains promises (or a mix of promises and values) with the given `iterator` function with the signature `(value, index, length)` where `value` is the resolved value of a respective promise in the input array. **Iteration happens serially**. If the iterator function returns a promise or a thenable, then the result of the promise is awaited before continuing with next iteration. If any promise in the input array is rejected, then the returned promise is rejected as well.

Resolves to the original array unmodified. This method is meant to be used for side effects. 

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.each";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.each";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
