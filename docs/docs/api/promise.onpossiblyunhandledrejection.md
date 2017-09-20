---
layout: api
id: promise.onpossiblyunhandledrejection
title: Promise.onPossiblyUnhandledRejection
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.onPossiblyUnhandledRejection

```js
Promise.onPossiblyUnhandledRejection(function(any error, Promise promise) handler) -> undefined
```


*Note: this hook is specific to the bluebird instance it's called on, application developers should use [global rejection events](/docs/api/error-management-configuration.html#global-rejection-events)*

Add `handler` as the handler to call when there is a possibly unhandled rejection. The default handler logs the error stack to stderr or `console.error` in browsers.

```js
Promise.onPossiblyUnhandledRejection(function(e, promise) {
    throw e;
});
```

Passing no value or a non-function will have the effect of removing any kind of handling for possibly unhandled rejections.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.onPossiblyUnhandledRejection";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.onpossiblyunhandledrejection";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
