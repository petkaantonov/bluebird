---
layout: api
id: promise.fromcallback
title: Promise.fromCallback
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.fromCallback

```js
Promise.fromCallback(
    function(function callback) resolver,
    [Object {multiArgs: boolean=false} options]
) -> Promise
```
```js
Promise.fromNode(
    function(function callback) resolver,
    [Object {multiArgs: boolean=false} options]
) -> Promise
```

Returns a promise that is resolved by a node style callback function. This is the most fitting way to do on the fly promisification when libraries don't expose classes for automatic promisification by undefined.

The resolver function is passed a callback that expects to be called back according to error-first node conventions.

Setting `multiArgs` to `true` means the resulting promise will always fulfill with an array of the callback's success value(s). This is needed because promises only support a single success value while
some callback API's have multiple success value. The default is to ignore all but the first success value of a callback function.

Using manual resolver:

```js
var Promise = require("bluebird");
// "email-templates" doesn't expose prototypes for promisification
var emailTemplates = Promise.promisify(require('email-templates'));
var templatesDir = path.join(__dirname, 'templates');


emailTemplates(templatesDir).then(function(template) {
    return Promise.fromCallback(function(callback) {
        return template("newsletter", callback);
    }, true).spread(function(html, text) {
        console.log(html, text);
    });
});
```

The same can also be written more concisely with `Function.prototype.bind`:

```js
var Promise = require("bluebird");
// "email-templates" doesn't expose prototypes for promisification
var emailTemplates = Promise.promisify(require('email-templates'));
var templatesDir = path.join(__dirname, 'templates');


emailTemplates(templatesDir).then(function(template) {
    return Promise.fromCallback(template.bind(null, "newsletter"), true)
        .spread(function(html, text) {
            console.log(html, text);
        });
});
```
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.fromCallback";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.fromcallback";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>