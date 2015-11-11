---
layout: api
id: promise.reduce
title: Promise.reduce
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.reduce

```js
Promise.reduce(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any accumulator, any item, int index, int length) reducer,
    [any initialValue]
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and [reduce the array to a value](http://en.wikipedia.org/wiki/Fold_\(higher-order_function\)) using the given `reducer` function.

If the reducer function returns a promise, then the result of the promise is awaited, before continuing with next iteration. If any promise in the array is rejected or a promise returned by the reducer function is rejected, the result is rejected as well.

Read given files sequentially while summing their contents as an integer. Each file contains just the text `10`.

```js
Promise.reduce(["file1.txt", "file2.txt", "file3.txt"], function(total, fileName) {
    return fs.readFileAsync(fileName, "utf8").then(function(contents) {
        return total + parseInt(contents, 10);
    });
}, 0).then(function(total) {
    //Total is 30
});
```

*If `initialValue` is `undefined` (or a promise that resolves to `undefined`) and the iterable contains only 1 item, the callback will not be called and the iterable's single item is returned. If the iterable is empty, the callback will not be called and `initialValue` is returned (which may be `undefined`).*

`Promise.reduce` will start calling the reducer as soon as possible, this is why you might want to use it over `Promise.all` (which awaits for the entire array before you can call [`Array#reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) on it).
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.reduce";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.reduce";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
