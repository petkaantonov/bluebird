---
layout: api
id: promise.onunhandledrejectionhandled
title: Promise.onUnhandledRejectionHandled
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.onUnhandledRejectionHandled

```js
Promise.onUnhandledRejectionHandled(function(Promise promise) handler) -> undefined
```


*Note: this hook is specific to the bluebird instance its called on, application developers should use [global rejection events](/docs/api/error-management-configuration.html#global-rejection-events)*

Add `handler` as the handler to call when a rejected promise that was reported as "possibly unhandled rejection" became handled.

Together with `onPossiblyUnhandledRejection` these hooks can be used to implement a debugger that will show a list
of unhandled promise rejections updated in real time as promises become handled.

For example:

```js
var unhandledPromises = [];
Promise.onPossiblyUnhandledRejection(function(reason, promise) {
    unhandledPromises.push(promise);
    //Update some debugger UI
});

Promise.onUnhandledRejectionHandled(function(promise) {
    var index = unhandledPromises.indexOf(promise);
    unhandledPromises.splice(index, 1);
    //Update the debugger UI
});
```
</markdown></div>
