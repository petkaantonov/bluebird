---
layout: api
id: progression-migration
title: Progression migration
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Progression migration

Progression has been removed as there are composability and chaining issues with APIs that use promise progression handlers. Implementing the common use case of progress bars can be accomplished using a pattern similar to [IProgress](http://blogs.msdn.com/b/dotnet/archive/2012/06/06/async-in-4-5-enabling-progress-and-cancellation-in-async-apis.aspx) in C#.

For old code that still uses it, see [the progression docs in the deprecated API documentation](/docs/deprecated-apis.html#progression).

Using jQuery before:

```js
Promise.resolve($.get(...))
    .progressed(function() {
        // ...
    })
    .then(function() {
        // ...
    })
    .catch(function(e) {
        // ...
    })
```

Using jQuery after:

```js
Promise.resolve($.get(...).progress(function() {
        // ...
    }))
    .then(function() {
        // ...
    })
    .catch(function(e) {
        // ...
    })
```

Implementing general progress interfaces like in C#:

```js
function returnsPromiseWithProgress(progressHandler) {
    return doFirstAction().tap(function() {
        progressHandler(0.33);
    }).then(doSecondAction).tap(function() {
        progressHandler(0.66);
    }).then(doThirdAction).tap(function() {
        progressHandler(1.00);
    });
}

returnsPromiseWithProgress(function(progress) {
    ui.progressbar.setWidth((progress * 200) + "px"); // update width on client side
}).then(function(value) { // action complete
   // entire chain is complete.
}).catch(function(e) {
    // error
});
```

Another example using `coroutine`:

```js
var doNothing = function() {};
var progressSupportingCoroutine = Promise.coroutine(function* (progress) {
        progress = typeof progress === "function" ? progress : doNothing;
        var first = yield getFirstValue();
        // 33% done
        progress(0.33);
        var second = yield getSecondValue();
        progress(0.67);
        var third = yield getThirdValue();
        progress(1);
        return [first, second, third];
});

var progressConsumingCoroutine = Promise.coroutine(function* () {
    var allValues = yield progressSupportingCoroutine(function(p) {
         ui.progressbar.setWidth((p * 200) + "px");
    });
    var second = allValues[1];
    // ...
});
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Progression migration";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-progression-migration";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
