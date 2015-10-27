---
layout: api
id: ascallback
title: .asCallback
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.asCallback

```js
.asCallback(
    [function(any error, any value) callback],
    [Object {spread: boolean=false} options]
) -> this
```
```js
.nodeify(
    [function(any error, any value) callback],
    [Object {spread: boolean=false} options]
) -> this
```

Register a node-style callback on this promise. When this promise is either fulfilled or rejected, the node callback will be called back with the node.js convention where error reason is the first argument and success value is the second argument. The error argument will be `null` in case of success.

Returns back this promise instead of creating a new one. If the `callback` argument is not a function, this method does not do anything.

This can be used to create APIs that both accept node-style callbacks and return promises:

```js
function getDataFor(input, callback) {
    return dataFromDataBase(input).asCallback(callback);
}
```

The above function can then make everyone happy.

Promises:

```js
getDataFor("me").then(function(dataForMe) {
    console.log(dataForMe);
});
```

Normal callbacks:

```js
getDataFor("me", function(err, dataForMe) {
    if( err ) {
        console.error( err );
    }
    console.log(dataForMe);
});
```

Promises can be rejected with falsy values (or no value at all, equal to rejecting with `undefined`), however `.asCallback` will call the callback with an `Error` object if the promise's rejection reason is a falsy value. You can retrieve the original falsy value from the error's `.cause` property.

Example:

```js
Promise.reject(null).asCallback(function(err, result) {
    // If is executed
    if (err) {
        // Logs 'null'
        console.log(err.cause);
    }
});
```

There is no effect on performance if the user doesn't actually pass a node-style callback function.

####Option: spread

Some nodebacks expect more than 1 success value but there is no mapping for this in the promise world. You may specify the option `spread` to call the nodeback with multiple values when the fulfillment value is an array:

```js
Promise.resolve([1,2,3]).asCallback(function(err, result) {
    // err == null
    // result is the array [1,2,3]
});

Promise.resolve([1,2,3]).asCallback(function(err, a, b, c) {
    // err == null
    // a == 1
    // b == 2
    // c == 3
}, {spread: true});

Promise.resolve(123).asCallback(function(err, a, b, c) {
    // err == null
    // a == 123
    // b == undefined
    // c == undefined
}, {spread: true});
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".asCallback";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-ascallback";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
