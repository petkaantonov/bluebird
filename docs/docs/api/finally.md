---
layout: api
id: finally
title: .finally
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.finally

```js
.finally(function() handler) -> Promise
```
```js
.lastly(function() handler) -> Promise
```


Pass a handler that will be called regardless of this promise's fate. Returns a new promise chained from this promise. There are special semantics for [`.finally`](.) in that the final value cannot be modified from the handler.

*Note: using [`.finally`](.) for resource management has better alternatives, see [resource management](/docs/api/resource-management.html)*

Consider the example:

```js
function anyway() {
    $("#ajax-loader-animation").hide();
}

function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).then(anyway, anyway);
}
```

This example doesn't work as intended because the `then` handler actually swallows the exception and returns `undefined` for any further chainers.

The situation can be fixed with `.finally`:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).finally(function() {
        $("#ajax-loader-animation").hide();
    });
}
```

Now the animation is hidden but, unless it throws an exception, the function has no effect on the fulfilled or rejected value of the returned promise.  This is similar to how the synchronous `finally` keyword behaves.

If the handler function passed to `.finally` returns a promise, the promise returned by `.finally` will not be settled until the promise returned by the handler is settled.  If the handler fulfills its promise, the returned promise will be fulfilled or rejected with the original value.  If the handler rejects its promise, the returned promise will be rejected with the handler's value.  This is similar to throwing an exception in a synchronous `finally` block, causing the original value or exception to be forgotten.  This delay can be useful if the actions performed by the handler are done asynchronously.  For example:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).finally(function() {
        return Promise.fromCallback(function(callback) {
            $("#ajax-loader-animation").fadeOut(1000, callback);
        });
    });
}
```

If the fade out completes successfully, the returned promise will be fulfilled or rejected with the value from `xhr`.  If `.fadeOut` throws an exception or passes an error to the callback, the returned promise will be rejected with the error from `.fadeOut`.

*For compatibility with earlier ECMAScript version, an alias `.lastly` is provided for [`.finally`](.).*
</markdown></div>
