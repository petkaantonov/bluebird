---
layout: api
id: suppressunhandledrejections
title: .suppressUnhandledRejections
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.suppressUnhandledRejections

```js
.suppressUnhandledRejections() -> undefined
```

Basically sugar for doing:

```js
somePromise.catch(function(){});
```

Which is needed in case error handlers are attached asynchronously to the promise later, which would otherwise result in premature unhandled rejection reporting.

Example:

```js
var tweets = fetchTweets();
$(document).on("ready", function() {
    tweets.then(function() {
        // Render tweets
    }).catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
});
```

If fetching tweets fails before the document is ready the rejection is reported as unhandled even though it will be eventually handled when the document is ready. This is of course impossible to determine automatically, but you can explicitly do so using `.suppressUnhandledRejections()`:

```js
var tweets = fetchTweets();
tweets.suppressUnhandledRejections();
$(document).on("ready", function() {
    tweets.then(function() {
        // Render tweets
    }).catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
});
```

It should be noted that there is no real need to attach the handlers asynchronously. Exactly the same effect can be achieved with:

```js
fetchTweets()
    .finally(function() {
        return $.ready.promise();
    })
    // DOM guaranteed to be ready after this point
    .then(function() {
        // Render tweets
    })
    .catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
```

The advantage of using `.suppressUnhandledRejections()` over `.catch(function(){})` is that it doesn't increment the branch count of the promise. Branch counts matter when using cancellation because a promise will only be cancelled if all of its branches want to cancel it.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".suppressUnhandledRejections";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-suppressunhandledrejections";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>