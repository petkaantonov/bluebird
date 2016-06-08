---
layout: api
id: built-in-error-types
title: Built-in error types
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Built-in error types

Bluebird includes a few built-in error types for common usage. All error types have the same identity across different copies of bluebird
module so that pattern matching works in [`.catch`](.). All error types have a constructor taking a message string as their first argument, with that message
becoming the `.message` property of the error object.

By default the error types need to be referenced from the Promise constructor, e.g. to get a reference to [TimeoutError](.), do `var TimeoutError = Promise.TimeoutError`. However, for convenience you will probably want to just make the references global.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Built-in error types";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-built-in-error-types";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>