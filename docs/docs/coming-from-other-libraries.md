---
id: coming-from-other-libraries
title: Coming From Other Libraries
---

This page is a reference for migrating to bluebird from other flow control or promise libraries.

 - Coming from native promises
 - Coming from jQuery deferreds
 - Coming from `async`
 - Coming from Q/Vow/RSVP
 - Coming from co/koa
 - Coming from highland, RxJS or BaconJS

##Coming from native promises

This is probably the easiest transition since bluebird promises are typically a drop-in replacement for native promises. You should notice more informative error messages, lower memory consumption and a performance boost in addition to the richer API right away.

In some modes in some browsers, the native `Promise` object can't be overridden - if you're using bluebird in a browser without a module loading system - a global `P` will be exported in addition.

Typically, all you have to do is:

```js
import Promise from "bluebird" // ES6
var Promise = require("bluebird"); // nodejs
define(["./bluebird"], function(Promise){..}) // amd
```

Things will work right away, you can keep consuming native promises in bluebird and transition gradually.

One difference is automatic promisification - see the [working with callbacks section]("/working-with-callbacks.html") on how you can greatly improve the performance of APIs you're consuming in node.

Bluebird also provides cancellation which native promises currently do not support.

##Coming from jQuery deferreds

Bluebird promises solve many issues [inherent to jQuery deferreds](http://stackoverflow.com/questions/23744612/problems-inherent-to-jquery-deferred).

Bluebird promises are throw safe and generally chain better. They comply to the Promises/A+ specification and generally behave well giving asynchronous guarantees jQuery deferreds do not offer.

Creation of a deferred is handled by the promise constructor. Please see the [working with callbacks section]("/working-with-callbacks.html") on how to work with it.

Also see [You're missing the point of promises!](https://blog.domenic.me/youre-missing-the-point-of-promises/).

It is worth mentioning that bluebird promises can assimilate jQuery promises/deferreds just fine, you can `Promise.resolve` a jQuery deferred or return it from a `then`.

##Coming from `async`

Bluebird typically makes usage of libraries like `async` redundant. Not only does it perform better - since promises are a primitive they allow for easy chaining and composition.

 - `async.map/filter` is handled by `Promise.map/filter`.
 - `async.parallel` and `async.each` is handled by running the actions and `Promise.all`ing the promises
 - `async.eachSeries` and `async.series` are handled by `Promise.each` or `Promise.map` with the concurrency parameter.
 - `async.reduce` is handled by `Promise.reduce`.

If you have any specific migration questions or APIs you can't find please let us know.

##Coming from Q/Vow/RSVP/When

Generally, bluebird offers a superset of the features of these libraries, providing more pragmatic and modern APIs whenever possible.

In general bluebird passes the tests of these libraries. [See this issue in particular for migration help](https://github.com/petkaantonov/bluebird/issues/63)

##Coming from co/koa

In recent versions generator libraries started abandoning old ideas of special tokens passed to callbacks and started using promises for what's being yielded.

Bluebird's `Promise.coroutine` is a generally faster version of these libraries and since you need to be yielding promises anyway - you might as well use it. It's also more extensible and supports cancellation.


##Coming from highland, RxJS or BaconJS

Stream libraries tend to serve a different purpose than promise libraries. Unlike promise libraries streams can represent multiple values.

That said, there are some people who think using streams for a single result is a good idea. These are the same people who think `Math.sin` should return an array of a single element, maybe.

Unlike streams promises are always multicast, always cold and always cached greatly simplifying the API surface.

If you're used to observables - promises should be a fun breeze to use. Not only are they much faster and create less overhead, they provide more debugging information and a simpler mental model to explain to the next guy.

Where you'd create a single observable, run it with a microtask scheduler, took one value, and broadcasted it - simply create a promise. Promises are immutable values + time.

Check out the benchmarks section for examples of transitioning an API from Bacon/Rx to promises.
