---
layout: api
id: spread
title: .spread
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.spread

```js
.spread(
    [function(any values...) fulfilledHandler]
) -> Promise
```


Like calling `.then`, but the fulfillment value _must be_ an array, which is flattened to the formal parameters of the fulfillment handler.

```js
Promise.all([
    fs.readFileAsync("file1.txt"),
    fs.readFileAsync("file2.txt")
]).spread(function(file1text, file2text) {
    if (file1text === file2text) {
        console.log("files are equal");
    }
    else {
        console.log("files are not equal");
    }
});
```

When chaining `.spread`, returning an array of promises also works:

```js
Promise.delay(500).then(function() {
   return [fs.readFileAsync("file1.txt"),
           fs.readFileAsync("file2.txt")] ;
}).spread(function(file1text, file2text) {
    if (file1text === file2text) {
        console.log("files are equal");
    }
    else {
        console.log("files are not equal");
    }
});
```

Note that if using ES6, the above can be replaced with [.then()](.) and destructuring:

```js
Promise.delay(500).then(function() {
   return [fs.readFileAsync("file1.txt"),
           fs.readFileAsync("file2.txt")] ;
}).all().then(function([file1text, file2text]) {
    if (file1text === file2text) {
        console.log("files are equal");
    }
    else {
        console.log("files are not equal");
    }
});
```

Note that [.spread()](.) implicitly does [.all()](.) but the ES6 destructuring syntax doesn't, hence the manual `.all()` call in the above code.

If you want to coordinate several discrete concurrent promises, use [`Promise.join`](.)
</markdown></div>
