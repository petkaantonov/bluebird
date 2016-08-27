---
layout: api
id: cancellation
title: Cancellation
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Cancellation

Cancellation has been redesigned for bluebird 3.x, any code that relies on 2.x cancellation semantics won't work in 3.x.

The cancellation feature is **by default turned off**, you can enable it using [Promise.config](.).

The new cancellation has "don't care" semantics while the old cancellation had abort semantics. Cancelling a promise simply means that its handler callbacks will not be called.

The advantages of the new cancellation compared to the old cancellation are:

- [.cancel()](.) is synchronous.
- no setup code required to make cancellation work
- composes with other bluebird features, like [Promise.all](.).
- [reasonable semantics for multiple consumer cancellation](#what-about-promises-that-have-multiple-consumers)

As an optimization, the cancellation signal propagates upwards the promise chain so that an ongoing operation e.g. network request can be aborted. However, *not* aborting the network request still doesn't make any operational difference as the callbacks are still not called either way.

You may register an optional cancellation hook at a root promise by using the `onCancel` argument that is passed to the executor function when cancellation is enabled:

```js
function makeCancellableRequest(url) {
    return new Promise(function(resolve, reject, onCancel) {
        var xhr = new XMLHttpRequest();
        xhr.on("load", resolve);
        xhr.on("error", reject);
        xhr.open("GET", url, true);
        xhr.send(null);
        // Note the onCancel argument only exists if cancellation has been enabled!
        onCancel(function() {
            xhr.abort();
        });
    });
}
```

Note that the `onCancel` hook is really an optional disconnected optimization, there is no real requirement to register any cancellation hooks for cancellation to work. As such, any errors that may occur while inside the `onCancel` callback are not caught and turned into rejections.

While `cancel().` is synchronous - `onCancel()` is called asynchronously (in the next turn) just like `then` handlers.

Example:

```js
var searchPromise = Promise.resolve();  // Dummy promise to avoid null check.
document.querySelector("#search-input").addEventListener("input", function() {
    // The handlers of the previous request must not be called
    searchPromise.cancel();
    var url = "/search?term=" + encodeURIComponent(this.value.trim());
    showSpinner();
    searchPromise = makeCancellableRequest(url)
        .then(function(results) {
            return transformData(results);
        })
        .then(function(transformedData) {
            document.querySelector("#search-results").innerHTML = transformedData;
        })
        .catch(function(e) {
            document.querySelector("#search-results").innerHTML = renderErrorBox(e);
        })
        .finally(function() {
            // This check is necessary because `.finally` handlers are always called.
            if (!searchPromise.isCancelled()) {
                hideSpinner();
            }
        });
});

```

As shown in the example the handlers registered with `.finally` are called even if the promise is cancelled. Another such exception is [.reflect()](.). No other types of handlers will be called in case of cancellation. This means that in `.then(onSuccess, onFailure)` neither `onSuccess` or `onFailure` handler is called. This is similar to how [`Generator#return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) works - only active `finally` blocks are executed and then the generator exits.

###What about promises that have multiple consumers?

It is often said that promises cannot be cancellable because they can have multiple consumers.

For instance:

```js
var result = makeCancellableRequest(...);

var firstConsumer = result.then(...);
var secondConsumer = result.then(...);
```

Even though in practice most users of promises will never have any need to take advantage of the fact that you can attach multiple consumers to a promise, it is nevertheless possible. The problem: "what should happen if [.cancel()](.) is called on `firstConsumer`?" Propagating the cancellation signal (and therefore making it abort the request) would be very bad as the second consumer might still be interested in the result despite the first consumer's disinterest.

What actually happens is that `result` keeps track of how many consumers it has, in this case 2, and only if all the consumers signal cancel will the request be aborted. However, as far as `firstConsumer` can tell, the promise was successfully cancelled and its handlers will not be called.

Note that it is an error to consume an already cancelled promise, doing such a thing will give you a promise that is rejected with `new CancellationError("late cancellation observer")` as the rejection reason.

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Cancellation";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-cancellation";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
