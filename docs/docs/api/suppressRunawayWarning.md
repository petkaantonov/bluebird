---
layout: api
id: suppressRunawayWarning
title: .suppressRunawayWarning
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.suppressRunawayWarning

```js
.suppressRunawayWarning() -> undefined
```

`.suppressRunawayWarning()` allows the producer of a Promise to suppress the [`Runaway Promise Warnings`](/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it) without completely disabling the warning. 

Example:

```js
function saveAnalytics(user) {
    return performSaveAnalytics(user)
        .suppressRunawayWarning();
}

function updateUser() {
    return getUser()
        .then(function (user) {
            // Perform this in the "background" and don't care about it's result at all
            saveAnalytics(user);
        });
}

updateUser('user')
    .then(() => {
        console.log('updated user');
    });
```

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".suppressRunawayWarning";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-suppressRunawayWarning";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
