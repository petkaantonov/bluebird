# when.js [![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when)

When.js is cujojs's lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation, derived from the async core of [wire.js](https://github.com/cujojs/wire), cujojs's IOC Container.  It also provides several other useful Promise-related concepts, such as joining multiple promises, mapping and reducing collections of promises, timed promises, and has a robust [unit test suite](#running-the-unit-tests).

It passes the [Promises/A Test Suite](https://github.com/domenic/promise-tests), is [frighteningly fast](https://github.com/cujojs/promise-perf-tests#test-results), and is **around 1.4k** when compiled with Google Closure (w/advanced optimizations) and gzipped, and has no external dependencies.

# What's New?

### 1.8.1

* Last 1.x.x release before 2.0.0 barring critical fixes.
	* To prepare for 2.0.0, [test your code against the dev-200 branch](https://github.com/cujojs/when/tree/dev-200). It is fully API compatible, but has fully asynchronous resolutions.
* Performance improvements for [when/function](docs/api.md#synchronous-functions).
* [Documentation](docs/api.md) updates and fixes. Thanks, [@unscriptable](https://github.com/unscriptable)!
* **DEPRECATED:** `deferred.progress` and `deferred.resolver.progress`. Use [`deferred.notify`](docs/api.md#progress-events) and [`deferred.resolver.notify`](docs/api.md#progress-events) instead.
* **DEPRECATED:** [`when.chain`](docs/api.md#whenchain). Use [`resolver.resolve(promise)`](docs/api.md#resolver) or `resolver.resolve(promise.yield)` ([see `promise.yield`](docs/api.md#yield)) instead.
* **DEPRECATED:** `when/timed` module.  Use [`when/delay`](docs/api.md#whendelay) and [`when/timeout`](docs/api.md#whentimeout) modules instead.

### 1.8.0

* New [when/function](docs/api.md#synchronous-functions), [when/node/function](docs/api.md#node-style-asynchronous-functions), and [when/callbacks](docs/api.md#asynchronous-functions) with functional programming goodness, and adapters for turning callback-based APIs into promise-based APIs. Kudos [@riccieri](https://github.com/riccieri)!
* New [when/unfold](docs/api.md#whenunfold), and [when/unfold/list](docs/api.md#whenunfoldlist) promise-aware anamorphic unfolds that can be used to generate and/or process unbounded lists.
* New [when/poll](docs/api.md#whenpoll) promise-based periodic polling and task execution. Kudos [@scothis](https://github.com/scothis)!

### 1.7.1

* Removed leftover internal usages of `deferred.then`.
* [when/debug](https://github.com/cujojs/when/wiki/when-debug) allows configuring the set of "fatal" error types that will be rethrown to the host env.

### 1.7.0

* **DEPRECATED:** `deferred.then` [is deprecated](docs/api.md#deferred) and will be removed in an upcoming release.  Use `deferred.promise.then` instead.
* [promise.yield](docs/api.md#yield)(promiseOrValue) convenience API for substituting a new value into a promise chain.
* [promise.spread](docs/api.md#spread)(variadicFunction) convenience API for spreading an array onto a fulfill handler that accepts variadic arguments. [Mmmm, buttery](http://s.shld.net/is/image/Sears/033W048977110001_20100422100331516?hei=1600&wid=1600&op_sharpen=1&resMode=sharp&op_usm=0.9,0.5,0,0)
* Doc improvements:
	* [when()](docs/api.md#when) and [promise.then()](docs/api.md#main-promise-api) have more info about callbacks and chaining behavior.
	* More info and clarifications about the roles of [Deferred](docs/api.md#deferred) and [Resolver](docs/api.md#resolver)
	* Several minor clarifications for various APIs
* Internal improvements to assimilation and interoperability with other promise implementations.

[Full Changelog](CHANGES.md)

# Docs & Examples

[API docs](docs/api.md#api)

[More info on the wiki](https://github.com/cujojs/when/wiki)

[Examples](https://github.com/cujojs/when/wiki/Examples)

Quick Start
===========

### AMD

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Configure your loader with a package:

	```javascript
	packages: [
		{ name: 'when', location: 'path/to/when/', main: 'when' },
		// ... other packages ...
	]
	```

1. `define(['when', ...], function(when, ...) { ... });` or `require(['when', ...], function(when, ...) { ... });`

### Script Tag

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. `<script src="path/to/when/when.js"></script>`
1. `when` will be available as `window.when`

### Node

1. `npm install when`
1. `var when = require('when');`

### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

# Running the Unit Tests

## Node

Note that when.js includes @domenic's [Promises/A Test Suite](https://github.com/domenic/promise-tests).  Running unit tests in Node will run both when.js's own test suite, and the Promises/A Test Suite.

1. `npm install`
1. `npm test`

## Browsers

1. `npm install`
1. `npm start` - starts buster server & prints a url
1. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
1. `npm run-script test-browser`

References
----------

Much of this code was inspired by @[unscriptable](https://github.com/unscriptable)'s [tiny promises](https://github.com/unscriptable/promises), the async innards of [wire.js](https://github.com/cujojs/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)

Some of the code has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
