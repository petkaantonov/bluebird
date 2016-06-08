---
id: install
title: Installation
---

- [Browser installation](#browser-installation)
- [Node installation](#node-installation)
- [Supported platforms](#supported-platforms)

##Browser installation

Download <a href="https://cdn.jsdelivr.net/bluebird/{{ site.version }}/bluebird.js">bluebird {{ site.version }} (development)</a>

Unminified source file meant to be used in development. Warnings and long stack traces are enabled which are taxing on performance.

```html
<script src="//cdn.jsdelivr.net/bluebird/{{ site.version }}/bluebird.js"></script>
```

Download <a href="https://cdn.jsdelivr.net/bluebird/{{ site.version }}/bluebird.min.js">bluebird {{ site.version }} (production)</a>

Minified source file meant to be used in production. Warnings and long straces are disabled. The gzipped size is 17.76KB.

```html
<script src="//cdn.jsdelivr.net/bluebird/{{ site.version }}/bluebird.min.js"></script>
```

Unless an AMD loader is installed, the script tag installation exposes the library in the `Promise` and `P` namespaces. If you want to restore the `Promise` namespace, use `var Bluebird = Promise.noConflict()`.

###Bower

```
$ bower install --save bluebird
```

###Browserify and Webpack

```
$ npm install --save bluebird
```

```js
var Promise = require("bluebird");
// Configure
Promise.config({
    longStackTraces: true,
    warnings: true
})
```

##Node installation

```
$ npm install --save bluebird
```

```js
var Promise = require("bluebird");
```

To enable long stack traces and warnings in node development:

```
$ NODE_ENV=development node server.js
```

To enable long stack traces and warnings in node production:

```
$ BLUEBIRD_DEBUG=1 node server.js
```

See [Environment Variables](.).

##Supported platforms

Bluebird officially supports and is tested on node.js, iojs and browsers starting from IE7. Unofficial platforms are supported with best effort only.

IE7 and IE8 do not support using keywords as property names, so if supporting these browsers is required you need to use the compatibility aliases:


- [`Promise.try()`](.) -> `Promise.attempt()`
- [`.catch()`](.) -> `.caught()`
- [`.finally()`](.) -> `.lastly()`
- [`.return()`](.) -> `.thenReturn()`
- [`.throw()`](.) -> `.thenThrow()`

Long stack traces are only supported in Chrome, recent Firefoxes and Internet Explorer 10+

[![Selenium Test Status](https://saucelabs.com/browser-matrix/petka_antonov.svg)](https://saucelabs.com/u/petka_antonov)
