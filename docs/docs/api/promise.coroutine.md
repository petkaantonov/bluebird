---
layout: api
id: promise.coroutine
title: Promise.coroutine
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.coroutine

```js
Promise.coroutine(GeneratorFunction(...arguments) generatorFunction, Object options) -> function
```

Returns a function that can use `yield` to yield promises. Control is returned back to the generator when the yielded promise settles. This can lead to less verbose code when doing lots of sequential async calls with minimal processing in between. Requires node.js 0.12+, io.js 1.0+ or Google Chrome 40+.

```js
var Promise = require("bluebird");

function PingPong() {

}

PingPong.prototype.ping = Promise.coroutine(function* (val) {
    console.log("Ping?", val);
    yield Promise.delay(500);
    this.pong(val+1);
});

PingPong.prototype.pong = Promise.coroutine(function* (val) {
    console.log("Pong!", val);
    yield Promise.delay(500);
    this.ping(val+1);
});

var a = new PingPong();
a.ping(0);
```

Running the example:

    $ node test.js
    Ping? 0
    Pong! 1
    Ping? 2
    Pong! 3
    Ping? 4
    Pong! 5
    Ping? 6
    Pong! 7
    Ping? 8
    ...

When called, the coroutine function will start an instance of the generator and returns a promise for its final value.

Doing `Promise.coroutine` is almost like using the C# `async` keyword to mark the function, with `yield` working as the `await` keyword. Promises are somewhat like `Task`s.

**Tip**

You are able to yield non-promise values by adding your own yield handler using  [`Promise.coroutine.addYieldHandler`](.) or calling `Promise.coroutine()` with a yield handler function as `options.yieldHandler`.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.coroutine";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.coroutine";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
