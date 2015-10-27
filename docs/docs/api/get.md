---
layout: api
id: get
title: .get
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.get

```js
.get(String propertyName|int index) -> Promise
```


This is a convenience method for doing:

```js
promise.then(function(obj) {
    return obj[propertyName];
});
```

For example:

```js
db.query("...")
    .get(0)
    .then(function(firstRow) {

    });
```

If `index` is negative, the indexed load will become `obj.length + index`. So that -1 can be used to read last item
in the array, -2 to read the second last and so on. For example:

```js
Promise.resolve([1,2,3]).get(-1).then(function(value) {
    console.log(value); // 3
});
```

If the `index` is still negative after `obj.length + index`, it will be clamped to 0.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".get";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-get";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>