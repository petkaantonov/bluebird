---
id: new-in-bluebird-3
title: New in bluebird 3.0
---

##Cancellation overhaul

Cancellation has been redesigned for bluebird 3.0. Any code that relies on 2.x cancellation semantics won't work in 3.0 or later. See [Cancellation](.) for more information.

##Promisification API changes

Both promisification \([Promise.promisify](.) and [Promise.promisifyAll](.)\) methods and [Promise.fromCallback](.) now by default ignore multiple arguments passed to the callback adapter and instead only the first argument is used to resolve the promise. The behavior in 2.x is to construct an array of the arguments and resolve the promise with it when more than one argument is passed to the callback adapter. The problems with this approach and reasons for the change are discussed in [#307](.).

[Promise.promisify](.)'s second argument is now an options object, so any code using the second argument needs to change:

```js
// 2.x
Promise.promisify(fn, ctx);
// 3.0
Promise.promisify(fn, {context: ctx});
```

Both promisification \([Promise.promisify](.) and [Promise.promisifyAll](.)\) methods and [Promise.fromCallback](.) all take a new boolean option `multiArgs` which defaults to `false`. Enabling this option will make the adapter callback *always* construct an array of the passed arguments regardless of amount of arguments. This can be used to reliably get access to all arguments rather than just the first one.

##Collection method changes

All collection methods now support objects that implement [ES6's *iterable*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) protocol along with regular arrays.

[Promise.props](.) and [.props](.) now support [ES6 `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) objects along with normal objects. Actual `Map` objects are only considered for their entries in the map instead of both entries and properties.


##Warnings

Warnings have been added to report usages which are very likely to be programmer errors. See [Promise.config](.) for how to enable warnings. See [Warning Explanations](warning-explanations.html) for list of the warnings and their explanations.

##Feature additions

- [.catch\(\)](.) now supports an object predicate as a filter: `.catch({code: 'ENOENT'}, e => ...)`.
- Added [.suppressUnhandledRejections\(\)](.).
- Added [.catchThrow\(\)](.).
- Added [.catchReturn\(\)](.).
- Added [Promise.mapSeries\(\)](.) and [.mapSeries\(\)](.)

##Deprecations

- `Promise.settle` has been deprecated. Use [.reflect](.) instead.
- `Promise.spawn` has been deprecated. Use [Promise.coroutine](.) instead.
- [Promise.try](.)'s `ctx` and `arg` arguments have been deprecated.
- `.nodeify` is now better known as [.asCallback](.)
- `.fromNode` is now better known as [Promise.fromCallback](.)


##Summary of breaking changes

- Promisifier APIs.
- Cancellation redesign.
- Promise progression has been completely removed.
- [.spread](.)'s second argument has been removed.
- [.done](.) causes an irrecoverable fatal error in Node.js environments now. See [#471](.) for rationale.
- Errors created with [Promise.reject](.) or `reject` callback of [new Promise](.) are no longer marked as [OperationalError](.)s.

##3.0.1 update

Note that the 3.0.1 update is strictly speaking backward-incompatible with 3.0.0. Version 3.0.0 changed the previous behavior of the `.each` method and made it work more same as the new `.mapSeries` - 3.0.1 unrolls this change by reverting to the `.tap`-like behavior found in 2.x However, this would only affect users who updated to 3.0.0 during the short time that it wasn't deprecated and started relying on the new `.each` behavior. This seems unlikely, and therefore the major version was not changed.
