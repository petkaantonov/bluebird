---
layout: api
id: promise.race
title: Promise.race
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.race

```js
Promise.race(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and return a promise that is fulfilled or rejected as soon as a promise in the array is fulfilled or rejected with the respective rejection reason or fulfillment value.

This method is only implemented because it's in the ES6 standard. If you want to race promises to fulfillment the [`.any`](.) method is more appropriate as it doesn't qualify a rejected promise as the winner. It also has less surprises: `.race` must become infinitely pending if an empty array is passed but passing an empty array to [`.any`](.) is more usefully a `RangeError`
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.race";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.race";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>