---
layout: api
id: tap
title: .tap
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.tap

```js
.tap(function(any value) handler) -> Promise
```


Like [`.finally`](.) that is not called for rejections.

```js
getUser().tap(function(user) {
    //Like in finally, if you return a promise from the handler
    //the promise is awaited for before passing the original value through
    return recordStatsAsync();
}).then(function(user) {
    //user is the user from getUser(), not recordStatsAsync()
});
```

Common case includes adding logging to an existing promise chain:

```js
doSomething()
    .then(...)
    .then(...)
    .then(...)
    .then(...)
```

```js
doSomething()
    .then(...)
    .then(...)
    .tap(console.log)
    .then(...)
    .then(...)
```

*Note: in browsers it is necessary to call `.tap` with `console.log.bind(console)` because console methods can not be called as stand-alone functions.*
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".tap";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-tap";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>