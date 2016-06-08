---
layout: api
id: promise.props
title: Promise.props
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.props

```js
Promise.props(Object|Map|Promise<Object|Map> input) -> Promise
```

Like [`.all`](.) but for object properties or `Map`s\* entries instead of iterated values. Returns a promise that is fulfilled when all the properties of the object or the `Map`'s' values\*\* are fulfilled. The promise's fulfillment value is an object or a `Map` with fulfillment values at respective keys to the original object or a `Map`. If any promise in the object or `Map` rejects, the returned promise is rejected with the rejection reason.

If `object` is a trusted `Promise`, then it will be treated as a promise for object rather than for its properties. All other objects (except `Map`s) are treated for their properties as is returned by `Object.keys` - the object's own enumerable properties.

*\*Only the native [ECMAScript 6 `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) implementation that is provided by the environment as is is supported*

*\*\*If the map's keys happen to be `Promise`s, they are not awaited for and the resulting `Map` will still have those same `Promise` instances as keys*


```js
Promise.props({
    pictures: getPictures(),
    comments: getComments(),
    tweets: getTweets()
}).then(function(result) {
    console.log(result.tweets, result.pictures, result.comments);
});
```

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var _ = require("lodash");
var path = require("path");
var util = require("util");

function directorySizeInfo(root) {
    var counts = {dirs: 0, files: 0};
    var stats = (function reader(root) {
        return fs.readdirAsync(root).map(function(fileName) {
            var filePath = path.join(root, fileName);
            return fs.statAsync(filePath).then(function(stat) {
                stat.filePath = filePath;
                if (stat.isDirectory()) {
                    counts.dirs++;
                    return reader(filePath)
                }
                counts.files++;
                return stat;
            });
        }).then(_.flatten);
    })(root).then(_);

    var smallest = stats.call("min", "size").call("pick", "size", "filePath").call("value");
    var largest = stats.call("max", "size").call("pick", "size", "filePath").call("value");
    var totalSize = stats.call("pluck", "size").call("reduce", function(a, b) {
        return a + b;
    }, 0);

    return Promise.props({
        counts: counts,
        smallest: smallest,
        largest: largest,
        totalSize: totalSize
    });
}


directorySizeInfo(process.argv[2] || ".").then(function(sizeInfo) {
    console.log(util.format("                                                \n\
        %d directories, %d files                                             \n\
        Total size: %d bytes                                                 \n\
        Smallest file: %s with %d bytes                                      \n\
        Largest file: %s with %d bytes                                       \n\
    ", sizeInfo.counts.dirs, sizeInfo.counts.files, sizeInfo.totalSize,
        sizeInfo.smallest.filePath, sizeInfo.smallest.size,
        sizeInfo.largest.filePath, sizeInfo.largest.size));
});
```

Note that if you have no use for the result object other than retrieving the properties, it is more convenient to use [`Promise.join`](.):

```js
Promise.join(getPictures(), getComments(), getTweets(),
    function(pictures, comments, tweets) {
    console.log(pictures, comments, tweets);
});
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.props";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.props";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>