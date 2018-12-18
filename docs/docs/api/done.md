---
layout: api
id: done
title: .done
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.done

```js
.done(
    [function(any value) fulfilledHandler],
    [function(any error) rejectedHandler]
) -> undefined
```


Like [`.then`](.), but any unhandled rejection that ends up here will crash the process (in node) or be thrown as an error (in browsers). The use of this method is heavily discouraged and it only exists for historical reasons.

<hr>
</markdown></div>
