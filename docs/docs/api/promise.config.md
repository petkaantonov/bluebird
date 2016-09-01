---
layout: api
id: promise.config
title: Promise.config
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.config

```js
Promise.config(Object {
    warnings: boolean=false,
    longStackTraces: boolean=false,
    cancellation: boolean=false,
    monitoring: boolean=false
} options) -> Object;
```

Configure long stack traces, warnings, monitoring and cancellation. Note that even though `false` is the default here, a development environment might be detected which automatically enables long stack traces and warnings.

```js
Promise.config({
    // Enable warnings
    warnings: true,
    // Enable long stack traces
    longStackTraces: true,
    // Enable cancellation
    cancellation: true,
    // Enable monitoring
    monitoring: true
});
```

You can configure the warning for checking forgotten return statements with `wForgottenReturn`:

```js
Promise.config({
    // Enables all warnings except forgotten return statements.
    warnings: {
        wForgottenReturn: false
    }
});
```

`wForgottenReturn` is the only warning type that can be separately configured. The corresponding environmental variable key is `BLUEBIRD_W_FORGOTTEN_RETURN`.

<hr>



In Node.js you may configure warnings and long stack traces for the entire process using environment variables:

```
BLUEBIRD_LONG_STACK_TRACES=1 BLUEBIRD_WARNINGS=1 node app.js
```

Both features are automatically enabled if the `BLUEBIRD_DEBUG` environment variable has been set or if the `NODE_ENV` environment variable is equal to `"development"`.

Using the value `0` will explicitly disable a feature despite debug environment otherwise activating it:

```
# Warnings are disabled despite being in development environment
NODE_ENV=development BLUEBIRD_WARNINGS=0 node app.js
```

Cancellation is always configured separately per bluebird instance.

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.config";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.config";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
