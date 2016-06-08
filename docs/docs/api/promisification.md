---
layout: api
id: promisification
title: Promisification
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promisification

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
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promisification";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promisification";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>