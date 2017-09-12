---
id: getting-started
title: Getting Started
redirect_from: "/index.html"
redirect_from: "/docs/index.html"
---

[getting-started]

## Node.js
Install Bluebird:
```
npm install bluebird --save
```
or
```
yarn add bluebird
```

Then import it in your code and use as you like:
```js
const Promise = require('bluebird');

export default class Cat {
  meow(currentMood) {
    return new Promise((resolve) => {
      const desiredTreats = 10;
      const meowLevel = desiredTreats * -currentMood;
      resolve(meowLevel);
    });
  }

  getOwnerAttention() {
    const actions = [this.meow(0), this.meow(-100), this.meow(-1000)];
    return Promise.all(actions);
  }
}
```

Caveat: if you are using ES7 `await`/`async` constructs, they will still return a native Promise, not a
Bluebird promise.

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
