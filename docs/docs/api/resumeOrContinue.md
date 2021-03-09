---
layout: api
id: resumeOrContinue
title: .resumeOrContinue
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.resumeOrContinue

```js
.resumeOrContinue(
    skipPointName,
    function(any value) fulfilledHandler
) -> Promise
```

Has a behaviour similar to [.resume](/docs/api/resume.html). However, [.resumeOrContinue](/docs/api/resumeOrContinue.html)
are called even any skip point was triggered.

Example:

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

You may have more than one skip point.

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".resumeOrContinue";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-resumeOrContinue";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
