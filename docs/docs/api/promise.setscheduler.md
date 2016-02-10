---
layout: api
id: promise.setscheduler
title: Promise.setScheduler
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.setScheduler

```js
Promise.setScheduler(function(function fn) scheduler) -> function
```


Scheduler should be a function that asynchronously schedules the calling of the passed in function:

```js
// This is just an example of how to use the api, there is no reason to do this
Promise.setScheduler(function(fn) {
    setTimeout(fn, 0);
});
```

Setting a custom scheduler could be necessary when you need a faster way to schedule functions than bluebird does by default. It also makes bluebird possible to use in platforms where normal timing constructs like `setTimeout` and `process.nextTick` are not available (like Nashhorn).

You can also use it as a hook:

```js
// This will synchronize bluebird promise queue flushing with angulars queue flushing
// Angular is also now responsible for choosing the actual scheduler
Promise.setScheduler(function(fn) {
    $rootScope.$evalAsync(fn);
});
```

> **Danger** - in order to keep bluebird promises [Promises/A+](http://www.promisesaplus) compliant a scheduler that executes the function asynchronously (like the examples in this page) must be used. 

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.setScheduler";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.setscheduler";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
