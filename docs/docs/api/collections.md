---
layout: api
id: collections
title: Collections
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Collections

Methods of `Promise` instances and core static methods of the Promise class to deal with collections of promises or mixed promises and values.

All collection methods have a static equivalent on the Promise object, e.g. `somePromise.map(...)...` is same as `Promise.map(somePromise, ...)...`,
`somePromise.all` is same as [`Promise.all`](.) and so on.

None of the collection methods modify the original input. Holes in arrays are treated as if they were defined with the value `undefined`.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Collections";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-collections";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>