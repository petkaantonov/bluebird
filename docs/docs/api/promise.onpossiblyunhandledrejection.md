---
layout: api
id: promise.onpossiblyunhandledrejection
title: Promise.onPossiblyUnhandledRejection
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.onPossiblyUnhandledRejection

```js
Promise.onPossiblyUnhandledRejection(function(any error, Promise promise) handler) -> undefined
```


*Note: this hook is specific to the bluebird instance it's called on, application developers should use [global rejection events](/docs/api/error-management-configuration.html#global-rejection-events)*

Add `handler` as the handler to call when there is a possibly unhandled rejection. The default handler logs the error stack to stderr or `console.error` in browsers.

```js
Promise.onPossiblyUnhandledRejection(function(e, promise) {
    throw e;
});
```

Passing no value or a non-function will have the effect of removing any kind of handling for possibly unhandled rejections.
</markdown></div>

