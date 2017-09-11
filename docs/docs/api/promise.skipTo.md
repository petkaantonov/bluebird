---
layout: api
id: promise.skipTo
title: Promise.skipTo
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.skipTo

```js
Promise.skipTo(
    skipPointName,
    [returnedValue]
)
```

Breaks the Promise chain and skip to a [.resumeOrContinue](/docs/api/resumeOrContinue.html) or [.resume](/docs/api/resume.html)
passing the `returnedValue` as argument.

```js
    getAccounts().then(function(accountList){
        if(accountList.length > 0) {
            return calculateBalance(accountList);
        } else {
            Promise.skipTo("summary", 0);    
        }
    }).then(balances => {
        //this block will not be run if there is no account
        return calculateWealth(balances);
    }).resumeOrContinue("summary", (wealth) => {
        //this block will be run anyway - unless a excption be thrown of course
        var response = {
            success: false,
            error: wealth,
        }
        return response;
    }).catch(error => {
       //normal catch 
    });
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.skipTo";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.skipTo";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
