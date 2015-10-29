---
layout: api
id: environment-variables
title: Environment variables
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Environment variables

This section only applies to node.js or io.js.

You can change bluebird behavior globally with various environment variables. These global variables affect all instances of bluebird that are running in your environment, rather than just the one you have `require`d in your application. The effect an environment variable has depends on the bluebird version.

Environment variables supported by 2.x:

- `BLUEBIRD_DEBUG` - Set to any truthy value this will enable long stack traces and warnings
- `NODE_ENV` - If set exactly to `development` it will have the same effect as if the `BLUEBIRD_DEBUG` variable was set.

Environment variables supported by 3.x:

- `BLUEBIRD_DEBUG` - If set this will enable long stack traces and warnings, unless those are explicitly disabled. Setting this to exactly `0` can be used to override `NODE_ENV=development` enabling long stack traces and warnings.
- `NODE_ENV` - If set exactly to `development` it will have the same effect as if the `BLUEBIRD_DEBUG` variable was set.
- `BLUEBIRD_WARNINGS` - if set exactly to `0` it will explicitly disable warnings and this overrides any other setting that might enable warnings. If set to any truthy value, it will explicitly enable warnings.
- `BLUEBIRD_LONG_STACK_TRACES` - if set exactly to `0` it will explicitly disable long stack traces and this overrides any other setting that might enable long stack traces. If set to any truthy value, it will explicitly enable long stack traces.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Environment variables";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-environment-variables";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
