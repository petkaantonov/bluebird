---
layout: api
id: synchronous-inspection
title: Synchronous inspection
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Synchronous inspection

Often it is known in certain code paths that a promise is guaranteed to be fulfilled at that point - it would then be extremely inconvenient to use [`.then`](.) to get at the promise's value as the callback is always called asynchronously.


**Note**: In recent versions of Bluebird a design choice was made to expose [.reason()](.) and [.value()](.) as well as other inspection methods on promises directly in order to make the below use case easier to work with. Every promise implements the [PromiseInspection](.) interface.

For example, if you need to use values of earlier promises in the chain, you could nest:


```js
// From Q Docs https://github.com/kriskowal/q/#chaining
// MIT License Copyright 2009–2014 Kristopher Michael Kowal.
function authenticate() {
    return getUsername().then(function (username) {
        return getUser(username);
    // chained because we will not need the user name in the next event
    }).then(function (user) {
        // nested because we need both user and password next
        return getPassword().then(function (password) {
            if (user.passwordHash !== hash(password)) {
                throw new Error("Can't authenticate");
            }
        });
    });
}
```

Or you could take advantage of the fact that if we reach password validation, then the user promise must be fulfilled:

```js
function authenticate() {
    var user = getUsername().then(function(username) {
        return getUser(username);
    });

    return user.then(function(user) {
        return getPassword();
    }).then(function(password) {
        // Guaranteed that user promise is fulfilled, so .value() can be called here
        if (user.value().passwordHash !== hash(password)) {
            throw new Error("Can't authenticate");
        }
    });
}
```

In the latter the indentation stays flat no matter how many previous variables you need, whereas with the former each additional previous value would require an additional nesting level.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Synchronous inspection";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-synchronous-inspection";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>