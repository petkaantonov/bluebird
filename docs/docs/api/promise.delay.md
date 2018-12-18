---
layout: api
id: promise.delay
title: Promise.delay
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.delay

```js
Promise.delay(
    int ms,
    [any|Promise<any> value=undefined]
) -> Promise
```


Returns a promise that will be resolved with `value` (or `undefined`) after given `ms` milliseconds. If `value` is a promise, the delay will start counting down when it is fulfilled and the returned promise will be fulfilled with the fulfillment value of the `value` promise. If `value` is a rejected promise, the resulting promise will be rejected immediately. 

```js
Promise.delay(500).then(function() {
    console.log("500 ms passed");
    return "Hello world";
}).delay(500).then(function(helloWorldString) {
    console.log(helloWorldString);
    console.log("another 500 ms passed") ;
});
```

<hr>
</markdown></div>

