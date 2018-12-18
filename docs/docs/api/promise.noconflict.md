---
layout: api
id: promise.noconflict
title: Promise.noConflict
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.noConflict

```js
Promise.noConflict() -> Object
```


This is relevant to browser environments with no module loader.

Release control of the `Promise` namespace to whatever it was before this library was loaded. Returns a reference to the library namespace so you can attach it to something else.

```html
<!-- the other promise library must be loaded first -->
<script type="text/javascript" src="/scripts/other_promise.js"></script>
<script type="text/javascript" src="/scripts/bluebird_debug.js"></script>
<script type="text/javascript">
//Release control right after
var Bluebird = Promise.noConflict();

//Cast a promise from some other Promise library using the Promise namespace to Bluebird:
var promise = Bluebird.resolve(new Promise());
</script>
```
</markdown></div>
