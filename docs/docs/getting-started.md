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

## Quick start

How to define a function that returns a promise.
```javascript
function doSomething() {
  return new Promise(function(resolve, reject) {
    // Do asynchronous things here, such as an AJAX request or a database look up
    var result = "Hello world";
    
    return resolve(result);
  });
}
```

How to use your newly created function.
```javascript
doSomething().then(function(result) {
  // result is now "Hello world"
});
```

For more information, please read the [API Reference](api-reference.html).
