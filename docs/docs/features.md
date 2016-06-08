---
id: features
title: Features
---

[features](unfinished-article)


- [Synchronous inspection](#synchronous-inspection)
- [Concurrency coordination](#concurrency-coordination)
- [Promisification on steroids](#promisification-on-steroids)
- [Debuggability and error handling](#debuggability-and-error-handling)
- [Resource management](#resource-management)
- [Cancellation and timeouts](#cancellation-and-timeouts)
- [Scoped prototypes](#scoped-prototypes)
- [Promise monitoring](#promise-monitoring)
- [Async/Await](#async-await)

##Synchronous inspection

Synchronous inspection allows you to retrieve the fulfillment value of an already fulfilled promise or the rejection reason of an already rejected promise synchronously.

Often it is known in certain code paths that a promise is guaranteed to be fulfilled at that point - it would then be extremely inconvenient to use [`.then`](.) to get at the promise's value as the callback is always called asynchronously.

See the API on [synchronous inspection](.) for more information.

##Concurrency coordination

Through the use of [.each](.) and [.map](.) doing things just at the right concurrency level becomes a breeze.

##Promisification on steroids

Promisification means converting an existing promise-unaware API to a promise-returning API.

The usual way to use promises in node is to [Promise.promisifyAll](.) some API and start exclusively calling promise returning versions of the APIs methods. E.g.

```js
var fs = require("fs");
Promise.promisifyAll(fs);
// Now you can use fs as if it was designed to use bluebird promises from the beginning

fs.readFileAsync("file.js", "utf8").then(...)
```

Note that the above is an exceptional case because `fs` is a singleton instance. Most libraries can be promisified by requiring the library's classes (constructor functions) and calling promisifyAll on the `.prototype`. This only needs to be done once in the entire application's lifetime and after that you may use the library's methods exactly as they are documented, except by appending the `"Async"`-suffix to method calls and using the promise interface instead of the callback interface.

As a notable exception in `fs`, `fs.existsAsync` doesn't work as expected, because Node's `fs.exists` doesn't call back with error as first argument.  More at [#418](.).  One possible workaround is using `fs.statAsync`.

Some examples of the above practice applied to some popular libraries:

```js
// The most popular redis module
var Promise = require("bluebird");
Promise.promisifyAll(require("redis"));
```

```js
// The most popular mongodb module
var Promise = require("bluebird");
Promise.promisifyAll(require("mongodb"));
```

```js
// The most popular mysql module
var Promise = require("bluebird");
// Note that the library's classes are not properties of the main export
// so we require and promisifyAll them manually
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);
```

```js
// Mongoose
var Promise = require("bluebird");
Promise.promisifyAll(require("mongoose"));
```

```js
// Request
var Promise = require("bluebird");
Promise.promisifyAll(require("request"));
// Use request.getAsync(...) not request(..), it will not return a promise
```

```js
// mkdir
var Promise = require("bluebird");
Promise.promisifyAll(require("mkdirp"));
// Use mkdirp.mkdirpAsync not mkdirp(..), it will not return a promise
```

```js
// winston
var Promise = require("bluebird");
Promise.promisifyAll(require("winston"));
```

```js
// rimraf
var Promise = require("bluebird");
// The module isn't promisified but the function returned is
var rimrafAsync = Promise.promisify(require("rimraf"));
```

```js
// xml2js
var Promise = require("bluebird");
Promise.promisifyAll(require("xml2js"));
```

```js
// jsdom
var Promise = require("bluebird");
Promise.promisifyAll(require("jsdom"));
```

```js
// fs-extra
var Promise = require("bluebird");
Promise.promisifyAll(require("fs-extra"));
```

```js
// prompt
var Promise = require("bluebird");
Promise.promisifyAll(require("prompt"));
```

```js
// Nodemailer
var Promise = require("bluebird");
Promise.promisifyAll(require("nodemailer"));
```

```js
// ncp
var Promise = require("bluebird");
Promise.promisifyAll(require("ncp"));
```

```js
// pg
var Promise = require("bluebird");
Promise.promisifyAll(require("pg"));
```

In all of the above cases the library made its classes available in one way or another. If this is not the case, you can still promisify by creating a throwaway instance:

```js
var ParanoidLib = require("...");
var throwAwayInstance = ParanoidLib.createInstance();
Promise.promisifyAll(Object.getPrototypeOf(throwAwayInstance));
// Like before, from this point on, all new instances + even the throwAwayInstance suddenly support promises
```

See also [`Promise.promisifyAll`](.).

##Debuggability and error handling

 - [Surfacing unhandled errors](#surfacing-unhandled-errors)
 - [Long stack traces](#long-stack-traces)
 - [Error pattern matching](#error-pattern-matching)
 - [Warnings](#warnings)

###Surfacing unhandled errors

The default approach of bluebird is to immediately log the stack trace when there is an unhandled rejection. This is similar to how uncaught exceptions cause the stack trace to be logged so that you have something to work with when something is not working as expected.

However because it is possible to handle a rejected promise at any time in the indeterminate future, some programming patterns will result in false positives. Because such programming patterns are not necessary and can always be refactored to never cause false positives, we recommend doing that to keep debugging as easy as possible . You may however feel differently so bluebird provides hooks to implement more complex failure policies.

Such policies could include:

- Logging after the promise became GCd (requires a native node.js module)
- Showing a live list of rejected promises
- Using no hooks and using [`.done`](.) to manually to mark end points where rejections will not be handled
- Swallowing all errors (challenge your debugging skills)
- ...

See [global rejection events](http://bluebirdjs.com/docs/api/error-management-configuration.html#global-rejection-events) to learn more about the hooks.

###Long stack traces

Normally stack traces don't go beyond asynchronous boundaries so their utility is greatly reduced in asynchronous code:

```js
setTimeout(function() {
    setTimeout(function() {
        setTimeout(function() {
            a.b.c;
        }, 1);
    }, 1)
}, 1)
```

```
ReferenceError: a is not defined
    at null._onTimeout file.js:4:13
    at Timer.listOnTimeout (timers.js:90:15)
```

Of course you could use hacks like monkey patching or domains but these break down when something can't be monkey patched or new apis are introduced.

Since in bluebird [promisification](.) is made trivial, you can get long stack traces all the time:

```js
var Promise = require("bluebird");

Promise.delay(1)
    .delay(1)
    .delay(1).then(function() {
        a.b.c;
    });
```

```
Unhandled rejection ReferenceError: a is not defined
    at file.js:6:9
    at processImmediate [as _immediateCallback] (timers.js:321:17)
From previous event:
    at Object.<anonymous> (file.js:5:15)
    at Module._compile (module.js:446:26)
    at Object.Module._extensions..js (module.js:464:10)
    at Module.load (module.js:341:32)
    at Function.Module._load (module.js:296:12)
    at Function.Module.runMain (module.js:487:10)
    at startup (node.js:111:16)
    at node.js:799:3
```

And there is more. Bluebird's long stack traces additionally eliminate cycles, don't leak memory, are not limited to a certain amount of asynchronous boundaries and are fast enough for most applications to be used in production. All these are non-trivial problems that haunt straight-forward long stack trace implementations.

See [installation](install.html) on how to enable long stack traces in your environment.

###Error pattern matching

Perhaps the greatest thing about promises is that it unifies all error handling into one mechanism where errors propagate automatically and have to be explicitly ignored.

###Warnings

Promises can have a steep learning curve and it doesn't help that promise standards go out of their way to make it even harder. Bluebird works around the limitations by providing warnings where the standards disallow throwing errors when incorrect usage is detected. See [Warning Explanations](warning-explanations.html) for the possible warnings that bluebird covers.

See [installation](install.html) on how to enable warnings in your environment.

###Promise monitoring

This feature enables subscription to promise lifecycle events via standard global events mechanisms in browsers and Node.js.

The following lifecycle events are available: 

 - `"promiseCreated"` - Fired when a promise is created through the constructor.
 - `"promiseChained"` - Fired when a promise is created through chaining (e.g. [.then](.)).
 - `"promiseFulfilled"` - Fired when a promise is fulfilled.
 - `"promiseRejected"` - Fired when a promise is rejected.
 - `"promiseResolved"` - Fired when a promise adopts another's state.
 - `"promiseCancelled"` - Fired when a promise is cancelled.

This feature has to be explicitly enabled by calling [Promise.config](.) with `monitoring: true`.

The actual subscription API depends on the environment.

1\. In Node.js, use `process.on`:

```js
// Note the event name is in camelCase, as per Node.js convention.
process.on("promiseChained", function(promise, child) {
    // promise - The parent promise the child was chained from
    // child - The created child promise.
});
```

2\. In modern browsers use `window.addEventListener` (window context) or `self.addEventListener()` (web worker or window context) method:

```js
// Note the event names are in mashedtogetherlowercase, as per DOM convention.
self.addEventListener("promisechained", function(event) {
    // event.details.promise - The parent promise the child was chained from
    // event.details.child - The created child promise.
});
```

3\. In legacy browsers use `window.oneventname = handlerFunction;`.

```js
// Note the event names are in mashedtogetherlowercase, as per legacy convention.
window.onpromisechained = function(promise, child) {
    // event.details.promise - The parent promise the child was chained from
    // event.details.child - The created child promise.
};
```

##Resource management

##Cancellation and timeouts

##Scoped prototypes

Building a library that depends on bluebird? You should know about the "scoped prototype" feature.

If your library needs to do something obtrusive like adding or modifying methods on the `Promise` prototype, uses long stack traces or uses a custom unhandled rejection handler then... that's totally ok as long as you don't use `require("bluebird")`. Instead you should create a file
that creates an isolated copy. For example, creating a file called `bluebird-extended.js` that contains:

```js
                //NOTE the function call right after
module.exports = require("bluebird/js/main/promise")();
```

Your library can then use `var Promise = require("bluebird-extended");` and do whatever it wants with it. Then if the application or other library uses their own bluebird promises they will all play well together because of Promises/A+ thenable assimilation magic.


##Async/Await

