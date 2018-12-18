---
layout: api
id: promise.try
title: Promise.try
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.try

```js
Promise.try(function() fn) -> Promise
```
```js
Promise.attempt(function() fn) -> Promise
```


Start the chain of promises with `Promise.try`. Any synchronous exceptions will be turned into rejections on the returned promise.

```js
function getUserById(id) {
    return Promise.try(function() {
        if (typeof id !== "number") {
            throw new Error("id must be a number");
        }
        return db.getUserById(id);
    });
}
```

Now if someone uses this function, they will catch all errors in their Promise `.catch` handlers instead of having to handle both synchronous and asynchronous exception flows.

*For compatibility with earlier ECMAScript version, an alias `Promise.attempt` is provided for [`Promise.try`](.).*
</markdown></div>
