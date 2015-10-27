---
layout: api
id: promise.bind
title: Promise.bind
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.bind

```js
Promise.bind(
    any|Promise<any> thisArg,
    [any|Promise<any> value=undefined]
) -> BoundPromise
```

Create a promise that follows this promise or in the static method is resolved with the given `value`, but is bound to the given `thisArg` value. A bound promise will call its handlers with the bound value set to `this`. Additionally promises derived from a bound promise will also be bound promises with the same `thisArg` binding as the original promise.

If `thisArg` is a promise or thenable, its resolution will be awaited for and the bound value will be the promise's fulfillment value. If `thisArg` rejects
then the returned promise is rejected with the `thisArg's` rejection reason. Note that this means you cannot use `this` without checking inside catch handlers for promises that bind to promise because in case of rejection of `thisArg`, `this` will be `undefined`.

<hr>

Without arrow functions that provide lexical `this`, the correspondence between async and sync code breaks down when writing object-oriented code. [`.bind`](.) alleviates this.

Consider:

```js
MyClass.prototype.method = function() {
    try {
        var contents = fs.readFileSync(this.file);
        var url = urlParse(contents);
        var result = this.httpGetSync(url);
        var refined = this.refine(result);
        return this.writeRefinedSync(refined);
    }
    catch (e) {
        this.error(e.stack);
    }
};
```

The above has a direct translation:

```js
MyClass.prototype.method = function() {
    return fs.readFileAsync(this.file).bind(this)
    .then(function(contents) {
        var url = urlParse(contents);
        return this.httpGetAsync(url);
    }).then(function(result) {
        var refined = this.refine(result);
        return this.writeRefinedAsync(refined);
    }).catch(function(e) {
        this.error(e.stack);
    });
};
```

`.bind` is the most efficient way of utilizing `this` with promises. The handler functions in the above code are not closures and can therefore even be hoisted out if needed. There is literally no overhead when propagating the bound value from one promise to another.

<hr>

`.bind` also has a useful side purpose - promise handlers don't need to share a function to use shared state:

```js
somethingAsync().bind({})
.spread(function (aValue, bValue) {
    this.aValue = aValue;
    this.bValue = bValue;
    return somethingElseAsync(aValue, bValue);
})
.then(function (cValue) {
    return this.aValue + this.bValue + cValue;
});
```

The above without [`.bind`](.) could be achieved with:

```js
var scope = {};
somethingAsync()
.spread(function (aValue, bValue) {
    scope.aValue = aValue;
    scope.bValue = bValue;
    return somethingElseAsync(aValue, bValue);
})
.then(function (cValue) {
    return scope.aValue + scope.bValue + cValue;
});
```

However, there are many differences when you look closer:

- Requires a statement so cannot be used in an expression context
- If not there already, an additional wrapper function is required to aundefined leaking or sharing `scope`
- The handler functions are now closures, thus less efficient and not reusable

<hr>

Note that bind is only propagated with promise transformation. If you create new promise chains inside a handler, those chains are not bound to the "upper" `this`:

```js
something().bind(var1).then(function() {
    //`this` is var1 here
    return Promise.all(getStuff()).then(function(results) {
        //`this` is undefined here
        //refine results here etc
    });
}).then(function() {
    //`this` is var1 here
});
```

However, if you are utilizing the full bluebird API offering, you will *almost never* need to resort to nesting promises in the first place. The above should be written more like:

```js
something().bind(var1).then(function() {
    //`this` is var1 here
    return getStuff();
}).map(function(result) {
    //`this` is var1 here
    //refine result here
}).then(function() {
    //`this` is var1 here
});
```

Also see [this Stackoverflow answer]`](.) can clean up code.

<hr>

If you don't want to return a bound promise to the consumers of a promise, you can rebind the chain at the end:

```js
MyClass.prototype.method = function() {
    return fs.readFileAsync(this.file).bind(this)
    .then(function(contents) {
        var url = urlParse(contents);
        return this.httpGetAsync(url);
    }).then(function(result) {
        var refined = this.refine(result);
        return this.writeRefinedAsync(refined);
    }).catch(function(e) {
        this.error(e.stack);
    }).bind(); //The `thisArg` is implicitly undefined - I.E. the default promise `this` value
};
```

Rebinding can also be abused to do something gratuitous like this:

```js
Promise.resolve("my-element")
    .bind(document)
    .then(document.getElementById)
    .bind(console)
    .then(console.log);
```

The above does `console.log`](.)s are necessary because in browser neither of the methods can be called as a stand-alone function.
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.bind";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.bind";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>