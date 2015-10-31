---
layout: api
id: promise.promisifyall
title: Promise.promisifyAll
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.promisifyAll

```js
Promise.promisifyAll(
    Object target,
    [Object {
        suffix: String="Async",
        multiArgs: boolean=false,
        filter: boolean function(String name, function func, Object target, boolean passesDefaultFilter),
        promisifier: function(function originalFunction, function defaultPromisifier)
    } options]
) -> Object
```

Promisifies the entire object by going through the object's properties and creating an async equivalent of each function on the object and its prototype chain. The promisified method name will be the original method name suffixed with `suffix` (default is `"Async"`). Any class properties of the object (which is the case for the main export of many modules) are also promisified, both static and instance methods. Class property is a property with a function value that has a non-empty `.prototype` object. Returns the input object.

Note that the original methods on the object are not overwritten but new methods are created with the `Async`-suffix. For example, if you `promisifyAll` the node.js `fs` object use `fs.statAsync` to call the promisified `stat` method.

Example:

```js
Promise.promisifyAll(require("redis"));

//Later on, all redis client instances have promise returning functions:

redisClient.hexistsAsync("myhash", "field").then(function(v) {

}).catch(function(e) {

});
```

It also works on singletons or specific instances:

```js
var fs = Promise.promisifyAll(require("fs"));

fs.readFileAsync("myfile.js", "utf8").then(function(contents) {
    console.log(contents);
}).catch(function(e) {
    console.error(e.stack);
});
```

See [promisification](#promisification) for more examples.

The entire prototype chain of the object is promisified on the object. Only enumerable are considered. If the object already has a promisified version of the method, it will be skipped. The target methods are assumed to conform to node.js callback convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument. If the node method calls its callback with multiple success values, the fulfillment value will be an array of them.

If a method name already has an `"Async"`-suffix, it will be duplicated. E.g. `getAsync`'s promisified name is `getAsyncAsync`.

####Option: suffix

Optionally, you can define a custom suffix through the options object:

```js
var fs = Promise.promisifyAll(require("fs"), {suffix: "MySuffix"});
fs.readFileMySuffix(...).then(...);
```

All the above limitations apply to custom suffices:

- Choose the suffix carefully, it must not collide with anything
- PascalCase the suffix
- The suffix must be a valid JavaScript identifier using ASCII letters
- Always use the same suffix everywhere in your application, you could create a wrapper to make this easier:

```js
module.exports = function myPromisifyAll(target) {
    return Promise.promisifyAll(target, {suffix: "MySuffix"});
};
```

####Option: multiArgs

Setting `multiArgs` to `true` means the resulting promise will always fulfill with an array of the callback's success value(s). This is needed because promises only support a single success value while some callback API's have multiple success value. The default is to ignore all but the first success value of a callback function.

If a module has multiple argument callbacks as an exception rather than the rule, you can filter out the multiple argument methods in first go and then promisify rest of the module in second go:

```js
Promise.promisifyAll(something, {
    filter: function(name) {
        return name === "theMultiArgMethodIwant";
    },
    multiArgs: true
});
// Rest of the methods
Promise.promisifyAll(something);
```

####Option: filter

Optionally, you can define a custom filter through the options object:

```js
Promise.promisifyAll(..., {
    filter: function(name, func, target, passesDefaultFilter) {
        // name = the property name to be promisified without suffix
        // func = the function
        // target = the target object where the promisified func will be put with name + suffix
        // passesDefaultFilter = whether the default filter would be passed
        // return boolean (return value is coerced, so not returning anything is same as returning false)

        return passesDefaultFilter && ...
    }
})
```

The default filter function will ignore properties that start with a leading underscore, properties that are not valid JavaScript identifiers and constructor functions (function which have enumerable properties in their `.prototype`).


####Option: promisifier

Optionally, you can define a custom promisifier, so you could promisifyAll e.g. the chrome APIs used in Chrome extensions.

The promisifier gets a reference to the original method and should return a function which returns a promise.

```js
function DOMPromisifier(originalMethod) {
    // return a function
    return function promisified() {
        var args = [].slice.call(arguments);
        // Needed so that the original method can be called with the correct receiver
        var self = this;
        // which returns a promise
        return new Promise(function(resolve, reject) {
            args.push(resolve, reject);
            originalMethod.apply(self, args);
        });
    };
}

// Promisify e.g. chrome.browserAction
Promise.promisifyAll(chrome.browserAction, {promisifier: DOMPromisifier});

// Later
chrome.browserAction.getTitleAsync({tabId: 1})
    .then(function(result) {

    });
```

Combining `filter` with `promisifier` for the restler module to promisify event emitter:

```js
var Promise = require("bluebird");
var restler = require("restler");
var methodNamesToPromisify = "get post put del head patch json postJson putJson".split(" ");

function EventEmitterPromisifier(originalMethod) {
    // return a function
    return function promisified() {
        var args = [].slice.call(arguments);
        // Needed so that the original method can be called with the correct receiver
        var self = this;
        // which returns a promise
        return new Promise(function(resolve, reject) {
            // We call the originalMethod here because if it throws,
            // it will reject the returned promise with the thrown error
            var emitter = originalMethod.apply(self, args);

            emitter
                .on("success", function(data, response) {
                    resolve([data, response]);
                })
                .on("fail", function(data, response) {
                    // Erroneous response like 400
                    resolve([data, response]);
                })
                .on("error", function(err) {
                    reject(err);
                })
                .on("abort", function() {
                    reject(new Promise.CancellationError());
                })
                .on("timeout", function() {
                    reject(new Promise.TimeoutError());
                });
        });
    };
};

Promise.promisifyAll(restler, {
    filter: function(name) {
        return methodNamesToPromisify.indexOf(name) > -1;
    },
    promisifier: EventEmitterPromisifier
});

// ...

// Later in some other file

var restler = require("restler");
restler.getAsync("http://...", ...,).spread(function(data, response) {

})
```

Using `defaultPromisifier` parameter to add enhancements on top of normal node
promisification:

```js
var fs = Promise.promisifyAll(require("fs"), {
    promisifier: function(originalFunction, defaultPromisifer) {
        var promisified = defaultPromisifier(originalFunction);

        return function() {
            // Enhance normal promisification by supporting promises as
            // arguments

            var args = [].slice.call(arguments);
            var self = this;
            return Promise.all(args).then(function(awaitedArgs) {
                return promisified.apply(self, awaitedArgs);
            });
        };
    }
});

// All promisified fs functions now await their arguments if they are promises
var version = fs.readFileAsync("package.json", "utf8").then(JSON.parse).get("version");
fs.writeFileAsync("the-version.txt", version, "utf8");
```

####Promisifying multiple classes in one go

You can promisify multiple classes in one go by constructing an array out of the classes and passing it to `promisifyAll`:

```js
var Pool = require("mysql/lib/Pool");
var Connection = require("mysql/lib/Connection");
Promise.promisifyAll([Pool, Connection]);
```

This works because the array acts as a "module" where the indices are the "module"'s properties for classes.



</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.promisifyAll";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.promisifyall";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>