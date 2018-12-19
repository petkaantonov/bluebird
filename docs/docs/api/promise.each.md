---
layout: api
id: promise.each
title: Promise.each
---



[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.each

```js
Promise.each(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) iterator
) -> Promise
```

[api/promise.each](unfinished-article)

Iterate over an array, or a promise of an array, which contains promises (or a mix of promises and values) with the given `iterator` function with the signature `(value, index, length)` where `value` is the resolved value of a respective promise in the input array. **Iteration happens serially**. If the iterator function returns a promise or a thenable, then the result of the promise is awaited before continuing with next iteration. If any promise in the input array is rejected, then the returned promise is rejected as well.

If all of the iterations resolve successfully, Promise.each resolves to the original array unmodified.  However, if one iteration rejects or errors, Promise.each ceases execution immediately and does not process any further iterations.  The error or rejected value is returned in this case instead of the original array.

This method is meant to be used for side effects. 

```js
var fileNames = ["1.txt", "2.txt", "3.txt"];

Promise.each(fileNames, function(fileName) {
    return fs.readFileAsync(fileName).then(function(val){
            // do stuff with 'val' here.  
        });
}).then(function() {
    console.log("done");
});
```

A simple usage example 

```js
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));
let fileNames = ['a.txt','b.txt','c.txt','d.txt']

// All promises will be executed serrialy the next 
// iteration will start only after the previous promise is fulfilled
return Promise.each(fileNames, file => {
    return fs.readFileAsync(path.resolve(__dirname, file)).then(data => {
        console.log(data.toString());
    }) // If you use then or catch here it'll be called after each iteration 


}).then(arr => { // Will be called after all promises are resolved 
    // arr will just include the original array 
    // so result handle should be inside each iteration
}).catch(err => { // Get here if one of the promises was rejected and stop all others

})
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.each";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.each";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
