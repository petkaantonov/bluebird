---
id: getting-started
title: Getting Started
redirect_from: "/index.html"
redirect_from: "/docs/index.html"
---

[getting-started](unfinished-article)

## Node.js

    npm install bluebird

Then:

```js
var Promise = require("bluebird");
```

Alternatively in ES6 

```js
import * as Promise from 'bluebird';
```

## Browsers

(See also [Installation](install.html).)

There are many ways to use bluebird in browsers:

- Direct downloads
    - Full build [bluebird.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.js)
    - Full build minified [bluebird.min.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.min.js)
    - Core build [bluebird.core.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.core.js)
    - Core build minified [bluebird.core.min.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.core.min.js)
- You may use browserify on the main export
- You may use the [bower](http://bower.io) package.

When using script tags the global variables `Promise` and `P` (alias for `Promise`) become available. Bluebird runs on a wide variety of browsers including older versions. We'd like to thank BrowserStack for giving us a free account which helps us test that. 
