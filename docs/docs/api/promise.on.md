---
layout: api
id: promise.on
title: Promise.on
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.on

```js
Promise.on(String eventName("created"|"chained"|"fulfilled"|"rejected"|"following"|"cancelled"), Function handler, [Boolean simpleEventAPI]) -> undefined
```
Subscribes a handler function for an event from promise lifecycle ("created", "chained", "fulfilled", "rejected", "following" and "cancelled").
Event handlers can be of 2 kinds:
1) Handler receives an event object in given format:
```js
function(Object:{guid: Number, childGuid: Number, eventName: String, detail: any, timeStamp: Date, stack: Trace}) -> undefined;
```
Example of event handler with event argument
```js
Promise.on("created", function(event) {
   var whenCreated = event.timeStamp;
});
```
2) Handler receives two promises: this (promise related to event) and other (chained promise, only for "chained")
   This option has smaller performance impact. simpleEventAPI flag has to be set to true to use this option.
```js
function(Promise this, Promise other);
```
Example of event handler with promise arguments
```js
Promise.on("chained", function(other) {
    var chainedFrom = this;
    var chainedTo = other;
}, true);
```
Note that reference for handler function is needed to un-subscribe the handler from event (see: [off](promise.off.html))
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.onPossiblyUnhandledRejection";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.onpossiblyunhandledrejection";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
