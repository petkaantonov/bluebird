---
layout: api
id: then
title: .then
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.then

```js
Promise1.then(
    [function(any value) fulfilledHandler],  //if the arguement 'value' exists, the first value is the value that the Promise1 returned 
    [function(any error) rejectedHandler]    //if the arguement 'error' exists, the first error is the reason of the Promise1
) -> Promise
```


[Promises/A+ `.then`](http://promises-aplus.github.io/promises-spec/). If you are new to promises, see the [Beginner's Guide]({{ "/docs/beginners-guide.html" | prepend: site.baseurl }}).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".then";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-then";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
