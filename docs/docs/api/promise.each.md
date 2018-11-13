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
    function(any value, int index, int arrayLength) iterator
) -> Promise<Array<any>>
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) (an array, for example), or a promise of an `Iterable`, iterates serially over all the values in it, executing the given `iterator` on each element. If an element is a promise, the iterator will wait for it before proceeding. The `iterator` function has signature `(value, index, arrayLength)` where `value` is the current element (or its resolved value if it is a promise).

If, at any step:

* The iterator returns a promise or a thenable, it is awaited before continuing to the next iteration.

* The current element of the iteration is a *pending* promise, that promise will be awaited before running the iterator.

* The current element of the iteration is a *rejected* promise, the iteration will stop and be rejected as well (with the same reason).

If all iterations resolve successfully, the `Promise.each` call resolves to a new array containing the resolved values of the original input elements.

`Promise.each` is very similar to [Promise.mapSeries](.). The difference between `Promise.each` and `Promise.mapSeries` is their resolution value. `Promise.each` resolves with an array as explained above, while `Promise.mapSeries` resolves with an array containing the *outputs* of the iterator function on each step. This way, `Promise.each` is meant to be mainly used for side-effect operations (since the outputs of the iterator are essentially discarded), just like the native `.forEach()` method of arrays, while `Promise.map` is meant to be used as an async version of the native `.map()` method of arrays.

Basic example:

```js
// The array to be iterated over can be a mix of values and promises.
var fileNames = ["1.txt", Promise.resolve("2.txt"), "3.txt", Promise.delay(3000, "4.txt"), "5.txt"];

Promise.each(fileNames, function(fileName, index, arrayLength) {
    // The iteration will be performed sequentially, awaiting for any
    // promises in the process.
    return fs.readFileAsync(fileName).then(function(fileContents) {
        // ...

        // The final resolution value of the iterator is is irrelevant,
        // since the result of the `Promise.each` has nothing to do with
        // the outputs of the iterator.
        return "anything"; // Doesn't matter
    });
}).then(function(result) {
    // This will run after the last step is done
    console.log("Done!")
    console.log(result); // ["1.txt", "2.txt", "3.txt", "4.txt", "5.txt"]
});
```

Example with a rejected promise in the array:

```js
// If one of the promises in the original array rejects,
// the iteration will stop once it reaches it
var items = ["A", Promise.delay(8000, "B"), Promise.reject("C"), "D"];

Promise.each(items, function(item) {
    return Promise.delay(4000).then(function() {
        console.log("On iterator: " + item);
    });
}).then(function(result) {
    // This not run
}).catch(function(rejection) {
    console.log("Catch: " + rejection);
});

// The code above outputs the following after 12 seconds (not 16!):
// On iterator: A
// On iterator: B
// Catch: C
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
