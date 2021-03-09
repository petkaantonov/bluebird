---
layout: api
id: resume
title: .resume
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.resume

```js
.resume(
    skipPointName,
    function(any value) fulfilledHandler
) -> Promise
```

Resume a promise chain interruped by [Promise.skip](/docs/api/promise.skip.html) point.

[.resume](.) will not be executed unless a skip point be called using its name.
You may use [.resumeOrContinue](/docs/api/resumeOrContinue.html) if you want to execute on both cases - on a skip point 
call and as a "next then" point. 

Example:

```js
    validateEmail(params).then(function(valid){
        if(valid) {
            return registerUser(params);
        } else {
            var result = new Error('Invalid e-mail');//it does not have to be an error
            Promise.skipTo("point1", result);    
        }
    }).then(success => {
        //registerUser response
        
    }).resume("point1", (result) => {
        //this code will be run ONLY if Promise.skipTo("point1", result); be called!
        var response = {
            success: false,
            error: result.message,
        }
        return response;
    }).then(success => {
        //this code will run anyway - unless a excepion be thrown of course!
    }).catch(error => {
       //normal catch 
    });
```

You may have more than one skip point.

</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".resume";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-resume";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
