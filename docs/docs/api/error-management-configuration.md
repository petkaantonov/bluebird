---
layout: api
id: error-management-configuration
title: Error management configuration
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Error management configuration

The default approach of bluebird is to immediately log the stack trace when there is an unhandled rejection. This is similar to how uncaught exceptions cause the stack trace to be logged so that you have something to work with when something is not working as expected.

However because it is possible to handle a rejected promise at any time in the indeterminate future, some programming patterns will result in false positives. Because such programming patterns are not necessary and can always be refactored to never cause false positives, we recommend doing that to keep debugging as easy as possible . You may however feel differently so bluebird provides hooks to implement more complex failure policies.

Such policies could include:

- Logging after the promise became GCd (requires a native node.js module)
- Showing a live list of rejected promises
- Using no hooks and using [`.done`](.) to manually to mark end points where rejections will not be handled
- Swallowing all errors (challenge your debugging skills)
- ...

<hr>

###Global rejection events

Starting from 2.7.0 all bluebird instances also fire rejection events globally so that applications can register one universal hook for them.

The global events are:

 - `"unhandledRejection"` (corresponds to the local [`Promise.onPossiblyUnhandledRejection`](.))
 - `"rejectionHandled"` (corresponds to the local [`Promise.onUnhandledRejectionHandled`](.))


Attaching global rejection event handlers in **node.js**:

```js
// NOTE: event name is camelCase as per node convention
process.on("unhandledRejection", function(reason, promise) {
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
});

// NOTE: event name is camelCase as per node convention
process.on("rejectionHandled", function(promise) {
    // See Promise.onUnhandledRejectionHandled for parameter documentation
});
```

Attaching global rejection event handlers in **browsers**:

Using DOM3 `addEventListener` APIs (support starting from IE9+):

```js
// NOTE: event name is all lower case as per DOM convention
window.addEventListener("unhandledrejection", function(e) {
    // NOTE: e.preventDefault() must be manually called to prevent the default
    // action which is currently to log the stack trace to console.warn
    e.preventDefault();
    // NOTE: parameters are properties of the event detail property
    var reason = e.detail.reason;
    var promise = e.detail.promise;
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
});

// NOTE: event name is all lower case as per DOM convention
window.addEventListener("rejectionhandled", function(e) {
    // NOTE: e.preventDefault() must be manually called prevent the default
    // action which is currently unset (but might be set to something in the future)
    e.preventDefault();
    // NOTE: parameters are properties of the event detail property
    var promise = e.detail.promise;
    // See Promise.onUnhandledRejectionHandled for parameter documentation
});
```

In Web Workers you may use `self.addEventListener`.

Using legacy APIs (support starting from IE6+):

```js
// NOTE: event name is all lower case as per legacy convention
window.onunhandledrejection = function(reason, promise) {
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
};

// NOTE: event name is all lower case as per legacy convention
window.onrejectionhandled = function(promise) {
    // See Promise.onUnhandledRejectionHandled for parameter documentation
};
```
<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Error management configuration";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-error-management-configuration";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>