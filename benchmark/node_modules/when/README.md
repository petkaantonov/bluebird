<a href="http://promises-aplus.github.com/promises-spec"><img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png" alt="Promises/A+ logo" align="right" /></a>

[![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when) 

# when.js

When.js is cujoJS's lightweight [Promises/A+](http://promises-aplus.github.com/promises-spec) and `when()` implementation that powers the async core of [wire.js](https://github.com/cujojs/wire), cujoJS's IOC Container.  It features:

* A rock solid, battle-tested Promise implementation
* Resolving, settling, mapping, and reducing arrays of promises
* Executing tasks in parallel and sequence
* Transforming Node-style and other callback-based APIs into promise-based APIs

It passes the [Promises/A+ Test Suite](https://github.com/promises-aplus/promises-tests), is [very fast](https://github.com/cujojs/promise-perf-tests#test-results) and compact, and has no external dependencies.

# What's New?

### 2.6.0

* New [`promise.done`](docs/api.md#done) allows consuming the ultimate value at the end of a promise chain while ensuring that any errors are thrown to the host environment so you get loud stack traces.
* `when/node/function` [`bindCallback`](docs/api.md#nodefn-bindcallback) and [`liftCallback`](docs/api.md#nodefn-liftcallback) now behave more like standard node-style APIs in that they allow exceptions to propagate to the host environment for loud stack traces.

### 2.5.1

* `ensure` now ignores non-functions, [like `then` does](http://promisesaplus.com/#point-25), for consistency. (#207)

### 2.5.0

* [Promises/A+ 1.1](http://promisesaplus.com) compliant.  Passes version 2.0.0 of the [Promises/A+ test suite](https://github.com/promises-aplus/promises-tests).

### 2.4.1

* New `MutationObserver` scheduler further reduces "time-to-first-handler" in modern browsers. (#198)
	* Also, this works around a horrible IE10 bug (desktop and mobile) that renders `setImmediate`, `MessageChannel`, and `postMessage` unusable as fast task schedulers.  Many thanks to @plaa and @calvinmetcalf for their help in discovering the problem and working out a solution. (#197)

### 2.4.0

* Experimental support for [vert.x 2.x](http://vertx.io). Should now run in vert.x >= 1.1.0.
* New `when.isPromiseLike` as the more accurately-named synonym for `when.isPromise`.
* **DEPRECATED**: `when.isPromise`. It can only tell you that something is "promise-like" (aka "thenable") anyway. Use the new, more accurately-named `when.isPromiseLike` instead.
* Fix for promise monitor reporting extra unhandled rejections for `when.all` and `when.map`.

### 2.3.0

* New [`promise.tap`](docs/api.md#tap) for adding side effects to a promise chain.
* New `MessageChannel` scheduler reduces "time-to-first" handler, in environments that support it.
* Performance optimizations for promise resolution.
* Internal architecture improvements to pave the way for when.js 3.0.0.

[Full Changelog](CHANGES.md)

# Docs & Examples

[API docs](docs/api.md#api)

[More info on the wiki](https://github.com/cujojs/when/wiki)

[Examples](https://github.com/cujojs/when/wiki/Examples)

Quick Start
===========

### AMD

1. Get it
	- `bower install when` or `yeoman install when`, *or*
	- `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Configure your loader with a package:

	```js
	packages: [
		{ name: 'when', location: 'path/to/when/', main: 'when' },
		// ... other packages ...
	]
	```

1. `define(['when', ...], function(when, ...) { ... });` or `require(['when', ...], function(when, ...) { ... });`

### Node

1. `npm install when`
1. `var when = require('when');`

### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

### Legacy environments

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Add a transient `define` shim, and a `<script>` element for when.js

	```html
	<script>
		window.define = function(factory) {
			try{ delete window.define; } catch(e){ window.define = void 0; } // IE
			window.when = factory();
		};
		window.define.amd = {};
	</script>
	<script src="path/to/when/when.js"></script>
	```

1. `when` will be available as `window.when`

# Running the Unit Tests

## Node

Note that when.js includes the [Promises/A+ Test Suite](https://github.com/promises-aplus/promise-tests).  Running unit tests in Node will run both when.js's own test suite, and the Promises/A+ Test Suite.

1. `npm install`
1. `npm test`

## Browsers

1. `npm install`
1. `npm start` - starts buster server & prints a url
1. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
1. `npm run-script test-browser`

References
----------

Much of this code was inspired by the async innards of [wire.js](https://github.com/cujojs/wire), and has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
