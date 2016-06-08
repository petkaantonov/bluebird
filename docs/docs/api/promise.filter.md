---
layout: api
id: promise.filter
title: Promise.filter
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.filter

```js
Promise.filter(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) filterer,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and [filter the array to another](http://en.wikipedia.org/wiki/Filter_\(higher-order_function\)) using the given `filterer` function.


It is essentially an efficient shortcut for doing a [.map](.) and then [`Array#filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter):

```js
Promise.map(valuesToBeFiltered, function(value, index, length) {
    return Promise.all([filterer(value, index, length), value]);
}).then(function(values) {
    return values.filter(function(stuff) {
        return stuff[0] == true
    }).map(function(stuff) {
        return stuff[1];
    });
});
```

Example for filtering files that are accessible directories in the current directory:

```js
var Promise = require("bluebird");
var E = require("core-error-predicates");
var fs = Promise.promisifyAll(require("fs"));

fs.readdirAsync(process.cwd()).filter(function(fileName) {
    return fs.statAsync(fileName)
        .then(function(stat) {
            return stat.isDirectory();
        })
        .catch(E.FileAccessError, function() {
            return false;
        });
}).each(function(directoryName) {
    console.log(directoryName, " is an accessible directory");
});
```

####Filter Option: concurrency

See [Map Option: concurrency](#map-option-concurrency)
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.filter";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.filter";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>