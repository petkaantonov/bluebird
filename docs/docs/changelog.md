---
id: changelog
title: Changelog
---

## 3.7.2 (2019-11-28)

Bugfixes:

 - Fixes firefox settimeout not initialized error \([#1623](.)\)


## 3.7.1 (2019-10-15)

Features:

 - feature

Bugfixes:

 - Fix \([#1614](.)\)
 - Fix \([#1613](.)\)
 - Fix \([#1616](.)\)

## 3.7.0 (2019-10-01)

Features:

 - Add [Promise.allSettled](.) method \([#1606](.)\)

## 3.6.0 (2019-10-01)

Features:

 - Add support for AsyncResource \([#1403](.)\)

Bugfixes:

 - Fix [.reduce](.) generating unhandled rejection events \([#1501](.)\)
 - Fix [Promise.reduce](.) generating unhandled rejction events \([#1502](.)\)
 - Fix [.map](.) and [.filter](.) generating unhandled rejection events \([#1487](.)\)
 - Fix [Promise.map](.) unhandled rejection events \([#1489](.)\)
 - Fix cancel skipping upward propagation \([#1459](.)\)
 - Fix loadTimes deprecation \([#1505](.)\)
 - Fix [Promise.each](.) maximum stack exceeded error \([#1326](.)\)
 - Make PromiseRejectionEvent confrom to spec \([#1509](.)\)
 - Fix false unhandled rejection events \([#1468](.)\)

## 3.5.5 (2019-05-24)

Features:

 - Added Symbol.toStringTag support to Promise \([#1421](.)\)

Bugfixes:

 - Fix error in IE9 \([#1591](.), [#1592](.)\)
 - Fix error with undefined stack trace \([#1537](.)\)
 - Fix [.catch](.) throwing an error later rather than immediately when passed non-function handler \([#1517](.)\)

## 3.5.4 (2019-04-03)

- Proper version check supporting VSCode\([#1576](.)\)

## 3.5.3 (2018-11-06)

Bugfixes:

 - Update acorn dependency

## 3.5.2 (2018-09-03)

Bugfixes:

 - Fix `PromiseRejectionEvent` to contain `.reason` and `.promise` properties. \([#1509](.), [#1464](.)\)
 - Fix promise chain retaining memory until the entire chain is resolved  \([#1544](.), [#1529](.)\)


## 3.5.1 (2017-10-04)

Bugfixes:

 - Fix false positive unhandled rejection when using async await \([#1404](.)\)
 - Fix false positive when reporting error as non-error \([#990](.)\)

## 3.5.0 (2017-03-03)

Features:

 - Added new method: [.tapCatch](.) \([#1220](.)\)

Bugfixes:

 - Fixed streamline benchmarks \([#1233](.)\)
 - Fixed yielding a function calling the function \([#1314](.), [#1315](.)\)
 - Fixed confusing error message when calling [.catch](.) with non function predicate \([#1350](.)\)
 - Fixed [.props](.) resolving to empty object when called with empty `Map` \([#1338](.)\)
 - Fixed confusing error message when invoking `Promise` directly without `new` \([#1320](.)\)
 - Added dedicated webpack entry point \([#1318](.)\)

## 3.4.7 (2016-12-22)

- Promise config returns reference to Bluebird library
- Updated logo
- Benchmark fix
- Don't drop syntaxerror context from stack traces
- Fix environment variables sometimes causing long stack traces  to be enabled

## 3.4.6 (2016-09-01)

Bugfixes:

- Fix [Promise.map](.) and [.map](.) not always calling the callback asynchronously \([#1148](.)\)

## 3.4.5 (2016-08-31)

Bugfixes:

 - Fix unhandled error regression introduced in 3.4.3 [#1217](.)

## 3.4.4 (2016-08-30)

Bugfixes:

 - Fix benchmark parallel in node 6 [#1165](.)
 - Fix memory leak with Promise.each [#1057](.)
 - Fix thenable passed to .return being evaluated too early [#1210](.)
 - Fix "unhandledrejection" event not having .detail field when using DOM3 event listener api [#1209](.)
 - Fix [Promise.join](.) not ensuring asynchronous callback [#1153](.)
 - Fix domains leaking when synchronous error is thrown while a domain is active [#1125](.)



## 3.4.3 (2016-08-25)

Bugfixes:

 - The "a promise was created in a handler but not returned from it" warning now highlights the file, line and column where the return statement is missing.
  - The "a promise was created in a handler but not returned from it" warning now adds the bluebird API method used to create the non-returned promise at the top of the warning stack

## 3.4.2 (2016-08-24)


Bugfixes:

 - Add missing link to unhandled warning docs \([#1205](.)\)
 - Fix [Promise.delay](.) not having a long stack trace \([#1182](.)\)
 - Fix false unhandled rejection when a rejected promise originating from one copy of bluebird is passed to another copy's [.return](.) or [.catchReturn](.) \([#1186](.)\)
 - Fix Promise.resolve is not a function error \([#1192](.)\)
 - Fix global events not being fired through DOM 3 API inside a worker \([#1190](.)\)
 - Fix .cancel() not immediately marking a promise as being cancelled if it has cancellable parent \([#1187](.)\)
 - Fix maximum callstack exceeded with [Promise.coroutine](.) \([#1170](.)\)

## 3.4.1 (2016-06-17)

Features:

 - Added [Promise.getNewLibraryCopy](.)

## 3.4.0 (2016-05-17)

Features:

 - Add `Promise.version` which tells the bluebird version as a string e.g. `"3.4.0"` ([#1042](.)).
 - [.map](.), [Promise.map](.), [.filter](.) and [Promise.filter](.) now return rejected promise when inappropriate options argument is passed ([#1097](.)).

Bugfixes:

- Fix bug where callback to [.disposer](.) is not called if the resource is `null` ([#1099](.)).
- Fix bug where assimilating thenable throws unexpectedly when using hostile host objects as thenables ([#1104](.)).

## 3.3.5 (2016-04-12)

Bugfixes:

 - Fix then sometimes not being called on iOS/Firefox ([#1022](.)).
 - Fix custom schedulers not being called when using promisified functions ([#1023](.)).
 - Fix unexpected error being thrown when promisifed function is called with no arguments ([#1063](.)).

## 3.3.4 (2016-03-07)

Features:

 - Warnings about created promises that are not returned are no longer given if the handler promise has not been chained. This should reduce the amount of false positives with this warning.

## 3.3.3 (2016-02-25)

Bugfixes:

 - Fix stack overflow error when a promise returned by promisified function rejects early in a huge array when using [Promise.mapSeries](.) or [Promise.each](.)


## 3.3.2 (2016-02-25)

Bugfixes:

 - Fix missing newline in stack trace reported by [.done()](.) ([#1020](.)).
 - Detect deep circular resolutions

## 3.3.1 (2016-02-13)

Bugfixes:

 - Fix crash when cancelling a [.tap()](.) handler promise ([#1006](.)).

## 3.3.0 (2016-02-12)

Features:

 - Cancelling Promise returned from [Promise.delay()](.) and [.delay()](.) now calls `clearTimeout` ([#1000](.))
 - Add [monitoring and lifecycle hooks](http://bluebirdjs.com/docs/features.html#promise-monitoring)
 - Add `'warning'` hook for warnings ([#980](.))

Bugfixes:

 - Fix warnings for "promise was rejected with non-error" being output when promises are rejected with errors from different realm ([#990](.))


## 3.2.2 (2016-02-05)

Bugfixes:

 - Make build script's output work without TTY

## 3.2.1 (2016-02-01)

Bugfixes:

 - Revert monitoring feature due to crash in browser


## 3.2.0 (2016-02-01)

- Broken build

## 3.1.5 (2016-01-26)

Dummy release to trigger CDN update.

## 3.1.4 (2016-01-25)

Bugfixes:

 - Fix broken npm prepublish script release


## 3.1.3 (2016-01-25)

Bugfixes:

 - Fix generators crashing in node 0.12 ([#978](.))
 - Add minimal build files to build ([#976](.), [#757](.))

## 3.1.2 (2016-01-23)

Features:

 - [.timeout()](.) now `clearTimeout`s the timer if the resulting promise is cancelled ([#926](.))
 - [Promise.coroutine](.) now returns function with same `.length` as the original function ([#927](.), [#933](.))

Bugfixes:

 - Fix long stack traces not working when promise is created from [Promise.fromCallback](.) ([#971](.))
 - Fix [.finally()](.) handlers not being called when promise is cancelled while a domain is active ([#963](.))
 - Fix [.timeout()](.) trying to cancel a promise even if cancellation is disabled ([#970](.))

## 3.1.1 (2015-12-16)

Bugfixes:

 - Disable wForgottenWarning when all warnings are disabled


## 3.1.0 (2015-12-16)

Features:

 - Added ability to configure the [forgotten return statement](http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-none-were-returned-from-it) warning separately \([#920](.)\).

Bugfixes:

- Fixed the bug where returning a value from [.finally](.) or [.tap](.) handler did not make a warning about a forgotten return go away \([#846](.)\).
- Fixed the bug where setTimeout is used in Chrome instead of MutationObserver \([#915](.)\)
- Fixed the bug where using [.bind](.) suppressed unhandled rejections \([#841](.)\)

## 3.0.6 (2015-12-01)

Bugfixes:

 - Fix [.timeout()](.) not cancelling parent \([#891](.)\)
 - Fix long stack traces when using [Promise.resolve()](.) \([#861](.)\)
 - Fix [Promise.config()](.) not disabling long stack traces when passing `longStackTraces: false` \([#897](.)\)

## 3.0.5 (2015-11-01)

Bugfixes:

 - Added [forgotten return warnings](http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-none-were-returned-from-it)  to [Promise.try](.) and [Promise.method](.)

## 3.0.4 (2015-11-01)

Bugfixes:

 - The stack trace for [forgotten return warnings](http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-none-were-returned-from-it) is more useful now.


## 3.0.3 (2015-11-01)

Bugfixes:

 - 3rd party libraries rejecting promises with non-errors no longer causes warnings
 - When `NODE_ENV` environment variable is `"development"` setting `BLUEBIRD_DEBUG` environment variable to `0` can now be used to disable debug mode

## 3.0.2 (2015-10-29)

Bugfixes:

 - Fix crash when using node.js domains [#829](.)

## 3.0.1 (2015-10-28)

See [New in 3.0](new-in-bluebird-3.html).

## 3.0.0 (2015-10-27)

See [New in 3.0](new-in-bluebird-3.html).

## 2.11.0 (2016-08-30)

Features:

 - feature

Bugfixes:

 - bugfix

## 2.10.2 (2015-10-01)

Features:

 - [.timeout()](.) now takes a custom error object as second argument

## 2.10.1 (2015-09-21)

 - Fix error "Cannot promisify an API that has normal methods with 'Async'-suffix" when promisifying certain objects with a custom promisifier

## 2.10.0 (2015-09-08)

Features:

 - `Promise.using` can now take the promises-for-resources as an array ([#733](.)).
 - Browser builds for minimal core are now hosted on CDN ([#724](.)).

Bugfixes:

 - Disabling debug mode with `BLUEBIRD_DEBUG=0` environment variable now works ([#719](.)).
 - Fix unhandled rejection reporting when passing rejected promise to `.return()` ([#721](.)).
 - Fix unbound promise's then handlers being called with wrong `this` value ([#738](.)).

## 2.9.34 (2015-07-15)

Bugfixes:

-  Correct domain for .map, .each, .filter, .reduce callbacks ([#701](.)).
 - Preserve bound-with-promise promises across the entire chain ([#702](.)).

## 2.9.33 (2015-07-09)

Bugfixes:

 - Methods on `Function.prototype` are no longer promisified ([#680](.)).

## 2.9.32 (2015-07-03)

Bugfixes:

 - Fix `.return(primitiveValue)` returning a wrapped version of the primitive value when a Node.js domain is active ([#689](.)).

## 2.9.31 (2015-07-03)

Bugfixes:

 - Fix Promises/A+ compliance issue regarding circular thenables: the correct behavior is to go into an infinite loop instead of warning with an error (Fixes [#682](.)).
 - Fix "(node) warning: possible EventEmitter memory leak detected" ([#661](.)).
 - Fix callbacks sometimes being called with a wrong node.js domain ([#664](.)).
 - Fix callbacks sometimes not being called at all in iOS 8.1 WebApp mode ([#666](.), [#687](.)).

## 2.9.30 (2015-06-14)

Bugfixes:

 - Fix regression with `promisifyAll` not promisifying certain methods

## 2.9.29 (2015-06-14)

Bugfixes:

 - Improve `promisifyAll` detection of functions that are class constructors. Fixes mongodb 2.x promisification.

## 2.9.28 (2015-06-14)

Bugfixes:

 - Fix handled rejection being reported as unhandled in certain scenarios when using [.all](.) or [Promise.join](.) ([#645](.))
 - Fix custom scheduler not being called in Google Chrome when long stack traces are enabled ([#650](.))

## 2.9.27 (2015-05-30)

Bugfixes:

 - Fix `sinon.useFakeTimers()` breaking scheduler ([#631](.))

Misc:

 - Add nw testing facilities (`node tools/test --nw`)

## 2.9.26 (2015-05-25)

Bugfixes:

 - Fix crash in NW [#624](.)
 - Fix [`.return()`](.) not supporting `undefined` as return value [#627](.)

## 2.9.25 (2015-04-28)

Bugfixes:

 - Fix crash in node 0.8

## 2.9.24 (2015-04-02)

Bugfixes:

 - Fix not being able to load multiple bluebird copies introduced in 2.9.22 ([#559](.), [#561](.), [#560](.)).

## 2.9.23 (2015-04-02)

Bugfixes:

 - Fix node.js domain propagation ([#521](.)).

## 2.9.22 (2015-04-02)

 - Fix `.promisify` crashing in phantom JS ([#556](.))

## 2.9.21 (2015-03-30)

 - Fix error object's `'stack'`' overwriting causing an error when its defined to be a setter that throws an error ([#552](.)).

## 2.9.20 (2015-03-29)

Bugfixes:

 - Fix regression where there is a long delay between calling `.cancel()` and promise actually getting cancelled in Chrome when long stack traces are enabled

## 2.9.19 (2015-03-29)

Bugfixes:

 - Fix crashing in Chrome when long stack traces are disabled

## 2.9.18 (2015-03-29)

Bugfixes:

 - Fix settlePromises using trampoline

## 2.9.17 (2015-03-29)


Bugfixes:

 - Fix Chrome DevTools async stack traceability ([#542](.)).

## 2.9.16 (2015-03-28)

Features:

 - Use setImmediate if available

## 2.9.15 (2015-03-26)

Features:

 - Added `.asCallback` alias for `.nodeify`.

Bugfixes:

 - Don't always use nextTick, but try to pick up setImmediate or setTimeout in NW. Fixes [#534](.), [#525](.)
 - Make progress a core feature. Fixes [#535](.) Note that progress has been removed in 3.x - this is only a fix necessary for 2.x custom builds.

## 2.9.14 (2015-03-12)

Bugfixes:

 - Always use process.nextTick. Fixes [#525](.)

## 2.9.13 (2015-02-27)

Bugfixes:

 - Fix .each, .filter, .reduce and .map callbacks being called synchornously if the input is immediate. ([#513](.))

## 2.9.12 (2015-02-19)

Bugfixes:

 - Fix memory leak introduced in 2.9.0 ([#502](.))

## 2.9.11 (2015-02-19)

Bugfixes:

 - Fix [#503](.)

## 2.9.10 (2015-02-18)

Bugfixes:

 - Fix [#501](.)

## 2.9.9 (2015-02-12)

Bugfixes:

 - Fix `TypeError: Cannot assign to read only property 'length'` when jsdom has declared a read-only length for all objects to inherit.

## 2.9.8 (2015-02-10)

Bugfixes:

 - Fix regression introduced in 2.9.7 where promisify didn't properly dynamically look up methods on `this`

## 2.9.7 (2015-02-08)

Bugfixes:

 - Fix `promisify` not retaining custom properties of the function. This enables promisifying the `"request"` module's export function and its methods at the same time.
 - Fix `promisifyAll` methods being dependent on `this` when they are not originally dependent on `this`. This enables e.g. passing promisified `fs` functions directly as callbacks without having to bind them to `fs`.
 - Fix `process.nextTick` being used over `setImmediate` in node.

## 2.9.6 (2015-02-02)

Bugfixes:

 - Node environment detection can no longer be fooled

## 2.9.5 (2015-02-02)

Misc:

 - Warn when [`.then()`](.) is passed non-functions

## 2.9.4 (2015-01-30)

Bugfixes:

 - Fix [.timeout()](.) not calling `clearTimeout` with the proper handle in node causing the process to wait for unneeded timeout. This was a regression introduced in 2.9.1.

## 2.9.3 (2015-01-27)

Bugfixes:

 - Fix node-webkit compatibility issue ([#467](https://github.com/petkaantonov/bluebird/pull/467))
 - Fix long stack trace support in recent firefox versions

## 2.9.2 (2015-01-26)

Bugfixes:

 - Fix critical bug regarding to using promisifyAll in browser that was introduced in 2.9.0 ([#466](https://github.com/petkaantonov/bluebird/issues/466)).

Misc:

 - Add `"browser"` entry point to package.json

## 2.9.1 (2015-01-24)

Features:

 - If a bound promise is returned by the callback to [`Promise.method`](.) and [`Promise.try`](.), the returned promise will be bound to the same value

## 2.9.0 (2015-01-24)

Features:

 - Add [`Promise.fromNode`](.)
 - Add new paramter `value` for [`Promise.bind`](.)

Bugfixes:

 - Fix several issues with [`cancellation`](.) and [`.bind()`](.) interoperation when `thisArg` is a promise or thenable
 - Fix promises created in [`disposers`](.) not having proper long stack trace context
 - Fix [`Promise.join`](.) sometimes passing the passed in callback function as the last argument to itself.

Misc:

 - Reduce minified full browser build file size by not including unused code generation functionality.
 - Major internal refactoring related to testing code and source code file layout

## 2.8.2 (2015-01-20)

Features:

 - [Global rejection events](https://github.com/petkaantonov/bluebird/blob/master/API.md#global-rejection-events) are now fired both as DOM3 events and as legacy events in browsers

## 2.8.1 (2015-01-20)

Bugfixes:

 - Fix long stack trace stiching consistency when rejected from thenables

## 2.8.0 (2015-01-19)

Features:

 - Major debuggability improvements:
    - Long stack traces have been re-designed. They are now much more readable,
      succint, relevant and consistent across bluebird features.
    - Long stack traces are supported now in IE10+

## 2.7.1 (2015-01-15)

Bugfixes:

 - Fix [#447](.)

## 2.7.0 (2015-01-15)

Features:

 - Added more context to stack traces originating from coroutines ([#421](https://github.com/petkaantonov/bluebird/issues/421))
 - Implemented [global rejection events](https://github.com/petkaantonov/bluebird/blob/master/API.md#global-rejection-events) ([#428](https://github.com/petkaantonov/bluebird/issues/428), [#357](https://github.com/petkaantonov/bluebird/issues/357))
 - [Custom promisifiers](https://github.com/petkaantonov/bluebird/blob/master/API.md#option-promisifier) are now passed the default promisifier which can be used to add enhancements on top of normal node promisification
 - [Promisification filters](https://github.com/petkaantonov/bluebird/blob/master/API.md#option-filter) are now passed `passesDefaultFilter` boolean

Bugfixes:

 - Fix `.noConflict()` call signature ([#446]())
 - Fix `Promise.method`ified functions being called with `undefined` when they were called with no arguments

## 2.6.4 (2015-01-12)

Bugfixes:

 - `OperationalErrors` thrown by promisified functions retain custom properties, such as `.code` and `.path`.

## 2.6.3 (2015-01-12)

Bugfixes:

 - Fix [#429](https://github.com/petkaantonov/bluebird/issues/429)
 - Fix [#432](https://github.com/petkaantonov/bluebird/issues/432)
 - Fix [#433](https://github.com/petkaantonov/bluebird/issues/433)

## 2.6.2 (2015-01-07)

Bugfixes:

 - Fix [#426](https://github.com/petkaantonov/bluebird/issues/426)

## 2.6.1 (2015-01-07)

Bugfixes:

 - Fixed built browser files not being included in the git tag release for bower

## 2.6.0 (2015-01-06)

Features:

 - Significantly improve parallel promise performance and memory usage (+50% faster, -50% less memory)


## 2.5.3 (2014-12-30)

## 2.5.2 (2014-12-29)

Bugfixes:

 - Fix bug where already resolved promise gets attached more handlers while calling its handlers resulting in some handlers not being called
 - Fix bug where then handlers are not called in the same order as they would run if Promises/A+ 2.3.2 was implemented as adoption
 - Fix bug where using `Object.create(null)` as a rejection reason would crash bluebird

## 2.5.1 (2014-12-29)

Bugfixes:

 - Fix `.finally` throwing null error when it is derived from a promise that is resolved with a promise that is resolved with a promise

## 2.5.0 (2014-12-28)

Features:

 - [`.get`](.) now supports negative indexing.

Bugfixes:

 - Fix bug with `Promise.method` wrapped function returning a promise that never resolves if the function returns a promise that is resolved with another promise
 - Fix bug with `Promise.delay` never resolving if the value is a promise that is resolved with another promise

## 2.4.3 (2014-12-28)

Bugfixes:

 - Fix memory leak as described in [this Promises/A+ spec issue](https://github.com/promises-aplus/promises-spec/issues/179).

## 2.4.2 (2014-12-21)

Bugfixes:

 - Fix bug where spread rejected handler is ignored in case of rejection
 - Fix synchronous scheduler passed to `setScheduler` causing infinite loop

## 2.4.1 (2014-12-20)

Features:

 - Error messages now have links to wiki pages for additional information
 - Promises now clean up all references (to handlers, child promises etc) as soon as possible.

## 2.4.0 (2014-12-18)

Features:

 - Better filtering of bluebird internal calls in long stack traces, especially when using minified file in browsers
 - Small performance improvements for all collection methods
 - Promises now delete references to handlers attached to them as soon as possible
 - Additional stack traces are now output on stderr/`console.warn` for errors that are thrown in the process/window from rejected `.done()` promises. See [#411](https://github.com/petkaantonov/bluebird/issues/411)

## 2.3.11 (2014-10-31)

Bugfixes:

 - Fix [#371](https://github.com/petkaantonov/bluebird/issues/371), [#373](https://github.com/petkaantonov/bluebird/issues/373)


## 2.3.10 (2014-10-28)

Features:

 - `Promise.method` no longer wraps primitive errors
 - `Promise.try` no longer wraps primitive errors

## 2.3.7 (2014-10-25)

Bugfixes:

 - Fix [#359](https://github.com/petkaantonov/bluebird/issues/359), [#362](https://github.com/petkaantonov/bluebird/issues/362) and [#364](https://github.com/petkaantonov/bluebird/issues/364)

## 2.3.6 (2014-10-15)

Features:

 - Implement [`.reflect()`](.)

## 2.3.5 (2014-10-06)

Bugfixes:

 - Fix issue when promisifying methods whose names contain the string 'args'

## 2.3.4 (2014-09-27)

 - `P` alias was not declared inside WebWorkers

## 2.3.3 (2014-09-27)

Bugfixes:

 - Fix [#318](https://github.com/petkaantonov/bluebird/issues/318), [#314](https://github.com/petkaantonov/bluebird/issues/#314)

## 2.3.2 (2014-08-25)

Bugfixes:

 - `P` alias for `Promise` now exists in global scope when using browser builds without a module loader, fixing an issue with firefox extensions

## 2.3.1 (2014-08-23)

Features:

 - `.using` can now be used with disposers created from different bluebird copy

## 2.3.0 (2014-08-13)

Features:

 - [`.bind()`](.) and [`Promise.bind()`](.) now await for the resolution of the `thisArg` if it's a promise or a thenable

Bugfixes:

 - Fix [#276](https://github.com/petkaantonov/bluebird/issues/276)

## 2.2.2 (2014-07-14)

 - Fix [#259](https://github.com/petkaantonov/bluebird/issues/259)

## 2.2.1 (2014-07-07)

 - Fix multiline error messages only showing the first line

## 2.2.0 (2014-07-07)

Bugfixes:

 - `.any` and `.some` now consistently reject with RangeError when input array contains too few promises
 - Fix iteration bug with `.reduce` when input array contains already fulfilled promises

## 2.1.3 (2014-06-18)

Bugfixes:

 - Fix [#235](https://github.com/petkaantonov/bluebird/issues/235)

## 2.1.2 (2014-06-15)

Bugfixes:

 - Fix [#232](https://github.com/petkaantonov/bluebird/issues/232)

## 2.1.1 (2014-06-11)

## 2.1.0 (2014-06-11)

Features:

 - Add [`promisifier`](.) option to `Promise.promisifyAll()`
 - Improve performance of `.props()` and collection methods when used with immediate values


Bugfixes:

 - Fix a bug where .reduce calls the callback for an already visited item
 - Fix a bug where stack trace limit is calculated to be too small, which resulted in too short stack traces

<sub>Add undocumented experimental `yieldHandler` option to `Promise.coroutine`</sub>

## 2.0.7 (2014-06-08)
## 2.0.6 (2014-06-07)
## 2.0.5 (2014-06-05)
## 2.0.4 (2014-06-05)
## 2.0.3 (2014-06-05)
## 2.0.2 (2014-06-04)
## 2.0.1 (2014-06-04)

## 2.0.0 (2014-06-04)

#What's new in 2.0

- [Resource management](api-reference.html#resource-management) - never leak resources again
- [Promisification](api-reference.html#promisification) on steroids - entire modules can now be promisified with one line of code
- [`.map()`](.), [`.each()`](.), [`.filter()`](.), [`.reduce()`](.) reimagined from simple sugar to powerful concurrency coordination tools
- [API Documentation](api-reference.html) has been reorganized and more elaborate examples added
- Deprecated [progression](#progression-migration) and [deferreds](#deferred-migration)
- Improved performance and readability

Features:

- Added [`using()`](.) and [`disposer()`](.)
- [`.map()`](.) now calls the handler as soon as items in the input array become fulfilled
- Added a concurrency option to [`.map()`](.)
- [`.filter()`](.) now calls the handler as soon as items in the input array become fulfilled
- Added a concurrency option to [`.filter()`](.)
- [`.reduce()`](.) now calls the handler as soon as items in the input array become fulfilled, but in-order
- Added [`.each()`](.)
- [`Promise.resolve()`](.) behaves like `Promise.cast`. `Promise.cast` deprecated.
- [Synchronous inspection](api-reference.html#synchronous-inspection): Removed `.inspect()`, added [`.value()`](.) and [`.reason()`](.)
- [`Promise.join()`](.) now takes a function as the last argument
- Added [`Promise.setScheduler()`](.)
- [`.cancel()`](.) supports a custom cancellation reason
- [`.timeout()`](.) now cancels the promise instead of rejecting it
- [`.nodeify()`](.) now supports passing multiple success results when mapping promises to nodebacks
- Added `suffix` and `filter` options to [`Promise.promisifyAll()`](.)

Breaking changes:

- Sparse array holes are not skipped by collection methods but treated as existing elements with `undefined` value
- `.map()` and `.filter()` do not call the given mapper or filterer function in any specific order
- Removed the `.inspect()` method
- Yielding an array from a coroutine is not supported by default. You can use [`coroutine.addYieldHandler()`](.) to configure the old behavior (or any behavior you want).
- [`.any()`](.) and [`.some()`](.) no longer use an array as the rejection reason. [`AggregateError`](.) is used instead.


## 1.2.4 (2014-04-27)

Bugfixes:

 - Fix promisifyAll causing a syntax error when a method name is not a valid identifier
 - Fix syntax error when es5.js is used in strict mode

## 1.2.3 (2014-04-17)

Bugfixes:

 - Fix [#179](https://github.com/petkaantonov/bluebird/issues/179)

## 1.2.2 (2014-04-09)

Bugfixes:

 - Promisified methods from promisifyAll no longer call the original method when it is overriden
 - Nodeify doesn't pass second argument to the callback if the promise is fulfilled with `undefined`

## 1.2.1 (2014-03-31)

Bugfixes:

 - Fix [#168](https://github.com/petkaantonov/bluebird/issues/168)

## 1.2.0 (2014-03-29)

Features:

 - New method: [`.value()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#value---dynamic)
 - New method: [`.reason()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#reason---dynamic)
 - New method: [`Promise.onUnhandledRejectionHandled()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promiseonunhandledrejectionhandledfunction-handler---undefined)
 - `Promise.map()`, `.map()`, `Promise.filter()` and `.filter()` start calling their callbacks as soon as possible while retaining a correct order. See [`8085922f`](https://github.com/petkaantonov/bluebird/commit/8085922fb95a9987fda0cf2337598ab4a98dc315).

Bugfixes:

 - Fix [#165](https://github.com/petkaantonov/bluebird/issues/165)
 - Fix [#166](https://github.com/petkaantonov/bluebird/issues/166)

## 1.1.1 (2014-03-18)

Bugfixes:

 - [#138](https://github.com/petkaantonov/bluebird/issues/138)
 - [#144](https://github.com/petkaantonov/bluebird/issues/144)
 - [#148](https://github.com/petkaantonov/bluebird/issues/148)
 - [#151](https://github.com/petkaantonov/bluebird/issues/151)

## 1.1.0 (2014-03-08)

Features:

 - Implement [`Promise.prototype.tap()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#tapfunction-handler---promise)
 - Implement [`Promise.coroutine.addYieldHandler()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisecoroutineaddyieldhandlerfunction-handler---void)
 - Deprecate `Promise.prototype.spawn`

Bugfixes:

 - Fix already rejected promises being reported as unhandled when handled through collection methods
 - Fix browserisfy crashing from checking `process.version.indexOf`

## 1.0.8 (2014-03-03)

Bugfixes:

 - Fix active domain being lost across asynchronous boundaries in Node.JS 10.xx

## 1.0.7 (2014-02-25)

Bugfixes:

 - Fix handled errors being reported

## 1.0.6 (2014-02-17)

Bugfixes:

 -  Fix bug with unhandled rejections not being reported
    when using `Promise.try` or `Promise.method` without
    attaching further handlers

## 1.0.5 (2014-02-15)

Features:

 - Node.js performance: promisified functions try to check amount of passed arguments in most optimal order
 - Node.js promisified functions will have same `.length` as the original function minus one (for the callback parameter)

## 1.0.4 (2014-02-09)

Features:

 - Possibly unhandled rejection handler will always get a stack trace, even if the rejection or thrown error was not an error
 - Unhandled rejections are tracked per promise, not per error. So if you create multiple branches from a single ancestor and that ancestor gets rejected, each branch with no error handler with the end will cause a possibly unhandled rejection handler invocation

Bugfixes:

 - Fix unhandled non-writable objects or primitives not reported by possibly unhandled rejection handler

## 1.0.3 (2014-02-05)

Bugfixes:

 - [#93](https://github.com/petkaantonov/bluebird/issues/88)

## 1.0.2 (2014-02-04)

Features:

 - Significantly improve performance of foreign bluebird thenables

Bugfixes:

 - [#88](https://github.com/petkaantonov/bluebird/issues/88)

## 1.0.1 (2014-01-28)

Features:

 - Error objects that have property `.isAsync = true` will now be caught by `.error()`

Bugfixes:

 - Fix TypeError and RangeError shims not working without `new` operator

## 1.0.0 (2014-01-12)

Features:

 - `.filter`, `.map`, and `.reduce` no longer skip sparse array holes. This is a backwards incompatible change.
 - Like `.map` and `.filter`, `.reduce` now allows returning promises and thenables from the iteration function.

Bugfixes:

 - [#58](https://github.com/petkaantonov/bluebird/issues/58)
 - [#61](https://github.com/petkaantonov/bluebird/issues/61)
 - [#64](https://github.com/petkaantonov/bluebird/issues/64)
 - [#60](https://github.com/petkaantonov/bluebird/issues/60)

## 0.11.6-1 (2013-12-29)

## 0.11.6-0 (2013-12-29)

Features:

 - You may now return promises and thenables from the filterer function used in `Promise.filter` and `Promise.prototype.filter`.

 - `.error()` now catches additional sources of rejections:

    - Rejections originating from `Promise.reject`

    - Rejections originating from thenables using
    the `reject` callback

    - Rejections originating from promisified callbacks
    which use the `errback` argument

    - Rejections originating from `new Promise` constructor
    where the `reject` callback is called explicitly

    - Rejections originating from `PromiseResolver` where
    `.reject()` method is called explicitly

Bugfixes:

 - Fix `captureStackTrace` being called when it was `null`
 - Fix `Promise.map` not unwrapping thenables

## 0.11.5-1 (2013-12-15)

## 0.11.5-0 (2013-12-03)

Features:

 - Improve performance of collection methods
 - Improve performance of promise chains

## 0.11.4-1 (2013-12-02)

## 0.11.4-0 (2013-12-02)

Bugfixes:

 - Fix `Promise.some` behavior with arguments like negative integers, 0...
 - Fix stack traces of synchronously throwing promisified functions'

## 0.11.3-0 (2013-12-02)

Features:

 - Improve performance of generators

Bugfixes:

 - Fix critical bug with collection methods.

## 0.11.2-0 (2013-12-02)

Features:

 - Improve performance of all collection methods

## 0.11.1-0 (2013-12-02)

Features:

- Improve overall performance.
- Improve performance of promisified functions.
- Improve performance of catch filters.
- Improve performance of .finally.

Bugfixes:

- Fix `.finally()` rejecting if passed non-function. It will now ignore non-functions like `.then`.
- Fix `.finally()` not converting thenables returned from the handler to promises.
- `.spread()` now rejects if the ultimate value given to it is not spreadable.

## 0.11.0-0 (2013-12-02)

Features:

 - Improve overall performance when not using `.bind()` or cancellation.
 - Promises are now not cancellable by default. This is backwards incompatible change - see [`.cancellable()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#cancellable---promise)
 - [`Promise.delay`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisedelaydynamic-value-int-ms---promise)
 - [`.delay()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#delayint-ms---promise)
 - [`.timeout()`](https://github.com/petkaantonov/bluebird/blob/master/API.md#timeoutint-ms--string-message---promise)

## 0.10.14-0 (2013-12-01)

Bugfixes:

 - Fix race condition when mixing 3rd party asynchrony.

## 0.10.13-1 (2013-11-30)

## 0.10.13-0 (2013-11-30)

Bugfixes:

 - Fix another bug with progression.

## 0.10.12-0 (2013-11-30)

Bugfixes:

 - Fix bug with progression.

## 0.10.11-4 (2013-11-29)

## 0.10.11-2 (2013-11-29)

Bugfixes:

 - Fix `.race()` not propagating bound values.

## 0.10.11-1 (2013-11-29)

Features:

 - Improve performance of `Promise.race`

## 0.10.11-0 (2013-11-29)

Bugfixes:

 - Fixed `Promise.promisifyAll` invoking property accessors. Only data properties with function values are considered.

## 0.10.10-0 (2013-11-28)

Features:

 - Disable long stack traces in browsers by default. Call `Promise.longStackTraces()` to enable them.

## 0.10.9-1 (2013-11-27)

Bugfixes:

 - Fail early when `new Promise` is constructed incorrectly

## 0.10.9-0 (2013-11-27)

Bugfixes:

 - Promise.props now takes a [thenable-for-collection](https://github.com/petkaantonov/bluebird/blob/f41edac61b7c421608ff439bb5a09b7cffeadcf9/test/mocha/props.js#L197-L217)
 - All promise collection methods now reject when a promise-or-thenable-for-collection turns out not to give a collection

## 0.10.8-0 (2013-11-25)

Features:

 - All static collection methods take thenable-for-collection

## 0.10.7-0 (2013-11-25)

Features:

 - throw TypeError when thenable resolves with itself
 - Make .race() and Promise.race() forever pending on empty collections

## 0.10.6-0 (2013-11-25)

Bugfixes:

 - Promise.resolve and PromiseResolver.resolve follow thenables too.

## 0.10.5-0 (2013-11-24)

Bugfixes:

 - Fix infinite loop when thenable resolves with itself

## 0.10.4-1 (2013-11-24)

Bugfixes:

 - Fix a file missing from build. (Critical fix)

## 0.10.4-0 (2013-11-24)

Features:

 - Remove dependency of es5-shim and es5-sham when using ES3.

## 0.10.3-0 (2013-11-24)

Features:

 - Improve performance of `Promise.method`

## 0.10.2-1 (2013-11-24)

Features:

 - Rename PromiseResolver#asCallback to PromiseResolver#callback

## 0.10.2-0 (2013-11-24)

Features:

 - Remove memoization of thenables

## 0.10.1-0 (2013-11-21)

Features:

 - Add methods `Promise.resolve()`, `Promise.reject()`, `Promise.defer()` and `.resolve()`.

## 0.10.0-1 (2013-11-17)

## 0.10.0-0 (2013-11-17)

Features:

 - Implement `Promise.method()`
 - Implement `.return()`
 - Implement `.throw()`

Bugfixes:

 - Fix promises being able to use themselves as resolution or follower value

## 0.9.11-1 (2013-11-14)

Features:

 - Implicit `Promise.all()` when yielding an array from generators

## 0.9.11-0 (2013-11-13)

Bugfixes:

 - Fix `.spread` not unwrapping thenables

## 0.9.10-2 (2013-11-13)

Features:

 - Improve performance of promisified functions on V8

Bugfixes:

 - Report unhandled rejections even when long stack traces are disabled
 - Fix `.error()` showing up in stack traces

## 0.9.10-1 (2013-11-05)

Bugfixes:

 - Catch filter method calls showing in stack traces

## 0.9.10-0 (2013-11-05)

Bugfixes:

 - Support primitives in catch filters

## 0.9.9-0 (2013-11-05)

Features:

 - Add `Promise.race()` and `.race()`

## 0.9.8-0 (2013-11-01)

Bugfixes:

 - Fix bug with `Promise.try` not unwrapping returned promises and thenables

## 0.9.7-0 (2013-10-29)

Bugfixes:

 - Fix bug with build files containing duplicated code for promise.js

## 0.9.6-0 (2013-10-28)

Features:

 - Improve output of reporting unhandled non-errors
 - Implement RejectionError wrapping and `.error()` method

## 0.9.5-0 (2013-10-27)

Features:

 - Allow fresh copies of the library to be made

## 0.9.4-1 (2013-10-27)

## 0.9.4-0 (2013-10-27)

Bugfixes:

 - Rollback non-working multiple fresh copies feature

## 0.9.3-0 (2013-10-27)

Features:

 - Allow fresh copies of the library to be made
 - Add more components to customized builds

## 0.9.2-1 (2013-10-25)

## 0.9.2-0 (2013-10-25)

Features:

 - Allow custom builds

## 0.9.1-1 (2013-10-22)

Bugfixes:

 - Fix unhandled rethrown exceptions not reported

## 0.9.1-0 (2013-10-22)

Features:

 - Improve performance of `Promise.try`
 - Extend `Promise.try` to accept arguments and ctx to make it more usable in promisification of synchronous functions.

## 0.9.0-0 (2013-10-18)

Features:

 - Implement `.bind` and `Promise.bind`

Bugfixes:

 - Fix `.some()` when argument is a pending promise that later resolves to an array

## 0.8.5-1 (2013-10-17)

Features:

 - Enable process wide long stack traces through BLUEBIRD_DEBUG environment variable

## 0.8.5-0 (2013-10-16)

Features:

 - Improve performance of all collection methods

Bugfixes:

 - Fix .finally passing the value to handlers
 - Remove kew from benchmarks due to bugs in the library breaking the benchmark
 - Fix some bluebird library calls potentially appearing in stack traces

## 0.8.4-1 (2013-10-15)

Bugfixes:

 - Fix .pending() call showing in long stack traces

## 0.8.4-0 (2013-10-15)

Bugfixes:

 - Fix PromiseArray and its sub-classes swallowing possibly unhandled rejections

## 0.8.3-3 (2013-10-14)

Bugfixes:

 - Fix AMD-declaration using named module.

## 0.8.3-2 (2013-10-14)

Features:

 - The mortals that can handle it may now release Zalgo by `require("bluebird/zalgo");`

## 0.8.3-1 (2013-10-14)

Bugfixes:

 - Fix memory leak when using the same promise to attach handlers over and over again

## 0.8.3-0 (2013-10-13)

Features:

 - Add `Promise.props()` and `Promise.prototype.props()`. They work like `.all()` for object properties.

Bugfixes:

 - Fix bug with .some returning garbage when sparse arrays have rejections

## 0.8.2-2 (2013-10-13)

Features:

 - Improve performance of `.reduce()` when `initialValue` can be synchronously cast to a value

## 0.8.2-1 (2013-10-12)

Bugfixes:

 - Fix .npmignore having irrelevant files

## 0.8.2-0 (2013-10-12)

Features:

 - Improve performance of `.some()`

## 0.8.1-0 (2013-10-11)

Bugfixes:

 - Remove uses of dynamic evaluation (`new Function`, `eval` etc) when strictly not necessary. Use feature detection to use static evaluation to avoid errors when dynamic evaluation is prohibited.

## 0.8.0-3 (2013-10-10)

Features:

 - Add `.asCallback` property to `PromiseResolver`s

## 0.8.0-2 (2013-10-10)

## 0.8.0-1 (2013-10-09)

Features:

 - Improve overall performance. Be able to sustain infinite recursion when using promises.

## 0.8.0-0 (2013-10-09)

Bugfixes:

 - Fix stackoverflow error when function calls itself "synchronously" from a promise handler

## 0.7.12-2 (2013-10-09)

Bugfixes:

 - Fix safari 6 not using `MutationObserver` as a scheduler
 - Fix process exceptions interfering with internal queue flushing

## 0.7.12-1 (2013-10-09)

Bugfixes:

 - Don't try to detect if generators are available to allow shims to be used

## 0.7.12-0 (2013-10-08)

Features:

 - Promisification now consider all functions on the object and its prototype chain
 - Individual promisifcation uses current `this` if no explicit receiver is given
 - Give better stack traces when promisified callbacks throw or errback primitives such as strings by wrapping them in an `Error` object.

Bugfixes:

 - Fix runtime APIs throwing synchronous errors

## 0.7.11-0 (2013-10-08)

Features:

 - Deprecate `Promise.promisify(Object target)` in favor of `Promise.promisifyAll(Object target)` to avoid confusion with function objects
 - Coroutines now throw error when a non-promise is `yielded`

## 0.7.10-1 (2013-10-05)

Features:

 - Make tests pass Internet Explorer 8

## 0.7.10-0 (2013-10-05)

Features:

 - Create browser tests

## 0.7.9-1 (2013-10-03)

Bugfixes:

 - Fix promise cast bug when thenable fulfills using itself as the fulfillment value

## 0.7.9-0 (2013-10-03)

Features:

 - More performance improvements when long stack traces are enabled

## 0.7.8-1 (2013-10-02)

Features:

 - Performance improvements when long stack traces are enabled

## 0.7.8-0 (2013-10-02)

Bugfixes:

 - Fix promisified methods not turning synchronous exceptions into rejections

## 0.7.7-1 (2013-10-02)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.7-0 (2013-10-01)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.6-0 (2013-09-29)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.5-0 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.4-1 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.4-0 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.3-1 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.3-0 (2013-09-27)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.2-0 (2013-09-27)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-5 (2013-09-26)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-4 (2013-09-25)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-3 (2013-09-25)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-2 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-1 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-0 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.0-1 (2013-09-23)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.0-0 (2013-09-23)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-2 (2013-09-20)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-1 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-0 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.4-1 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.4-0 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-4 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-3 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-2 (2013-09-16)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-1 (2013-09-16)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-0 (2013-09-15)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.2-1 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.2-0 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.1-0 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.0-0 (2013-09-13)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-6 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-5 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-4 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-3 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-2 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-1 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.8-1 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.8-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.7-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.6-1 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.6-0 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.5-1 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.5-0 (2013-09-09)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.4-1 (2013-09-08)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.4-0 (2013-09-08)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.3-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.2-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.1-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.0-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.4.0-0 (2013-09-06)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.3.0-1 (2013-09-06)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.3.0 (2013-09-06)
