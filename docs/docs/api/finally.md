---
layout: api
id: finally
title: .finally
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.finally

```js
.finally(function() handler) -> Promise
```
```js
.lastly(function() handler) -> Promise
```


Pass a handler that will be called regardless of this promise's fate. Returns a new promise chained from this promise. There are special semantics for [`.finally`](.) in that the final value cannot be modified from the handler.

*Note: using [`.finally`](.) for resource management has better alternatives, see [resource management](/docs/api/resource-management.html)*

Consider the example:

```js
function anyway() {
    $("#ajax-loader-animation").hide();
}

function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).then(anyway, anyway);
}
```

This example doesn't work as intended because the `then` handler actually swallows the exception and returns `undefined` for any further chainers.

The situation can be fixed with `.finally`:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).finally(function() {
        $("#ajax-loader-animation").hide();
    });
}
```

Now the animation is hidden but an exception or the actual return value will automatically skip the finally and propagate to further chainers. This is more in line with the synchronous `finally` keyword.

*For compatibility with earlier ECMAScript version, an alias `.lastly` is provided for [`.finally`](.).*
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".finally";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-finally";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>