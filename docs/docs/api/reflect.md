---
layout: api
id: reflect
title: .reflect
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.reflect

```js
.reflect() -> Promise<PromiseInspection>
```


The [`.reflect`](.) method returns a promise that is always successful when this promise is settled. Its fulfillment value is an object that implements the [PromiseInspection](.) interface and reflects the resolution of this promise.

Using `.reflect()` to implement `settleAll` (wait until all promises in an array are either rejected or fulfilled) functionality

```js
var promises = [getPromise(), getPromise(), getPromise()];
Promise.all(promises.map(function(promise) {
    return promise.reflect();
})).each(function(inspection) {
    if (inspection.isFulfilled()) {
        console.log("A promise in the array was fulfilled with", inspection.value());
    } else {
        console.error("A promise in the array was rejected with", inspection.reason());
    }
});
```

Using `.reflect()` to implement `settleProps` (like settleAll for an object's properties) functionality

```js
var object = {
    first: getPromise1(),
    second: getPromise2()
};
Promise.props(Object.keys(object).reduce(function(newObject, key) {
    newObject[key] = object[key].reflect();
    return newObject;
}, {})).then(function(object) {
    if (object.first.isFulfilled()) {
        console.log("first was fulfilled with", object.first.value());
    } else {
        console.error("first was rejected with", object.first.reason());
    }
})
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".reflect";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-reflect";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
