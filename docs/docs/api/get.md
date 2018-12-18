---
layout: api
id: get
title: .get
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.get

```js
.get(String propertyName|int index) -> Promise
```


This is a convenience method for doing:

```js
promise.then(function(obj) {
    return obj[propertyName];
});
```

For example:

```js
db.query("...")
    .get(0)
    .then(function(firstRow) {

    });
```

If `index` is negative, the indexed load will become `obj.length + index`. So that -1 can be used to read last item
in the array, -2 to read the second last and so on. For example:

```js
Promise.resolve([1,2,3]).get(-1).then(function(value) {
    console.log(value); // 3
});
```

If the `index` is still negative after `obj.length + index`, it will be clamped to 0.
</markdown></div>
