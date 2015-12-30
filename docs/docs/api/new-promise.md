---
layout: api
id: new-promise
title: new Promise
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##new Promise

```js
new Promise(function(function resolve, function reject) resolver) -> Promise
```


Create a new promise. The passed in function will receive functions `resolve` and `reject` as its arguments which can be called to seal the fate of the created promise.

*Note: See [explicit construction anti-pattern]({{ "/docs/anti-patterns.html#the-explicit-construction-anti-pattern" | prepend: site.baseurl }}) before creating promises yourself*

Example:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    });
}
```

If you pass a promise object to the `resolve` function, the created promise will follow the state of that promise.

<hr>

To make sure a function that returns a promise is following the implicit but critically important contract of promises, you can start a function with `new Promise` if you cannot start a chain immediately:

```js
function getConnection(urlString) {
    return new Promise(function(resolve) {
        //Without new Promise, this throwing will throw an actual exception
        var params = parse(urlString);
        resolve(getAdapter(params).getConnection());
    });
}
```

The above ensures `getConnection` fulfills the contract of a promise-returning function of never throwing a synchronous exception. Also see [`Promise.try`](.) and [`Promise.method`](.)

The resolver is called synchronously (the following is for documentation purposes and not idiomatic code):

```js
function getPromiseResolveFn() {
    var res;
    new Promise(function (resolve) {
        res = resolve;
    });
    // res is guaranteed to be set
    return res;
}
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "new Promise";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-new-promise";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
