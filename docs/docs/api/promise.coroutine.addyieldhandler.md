---
layout: api
id: promise.coroutine.addyieldhandler
title: Promise.coroutine.addYieldHandler
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.coroutine.addYieldHandler

```js
Promise.coroutine.addYieldHandler(function handler) -> undefined
```


By default you can only yield Promises and Thenables inside coroutines. You can use this function to add yielding support for arbitrary types.

For example, if you wanted `yield 500` to be same as `yield Promise.delay`:

```js
Promise.coroutine.addYieldHandler(function(value) {
     if (typeof value === "number") return Promise.delay(value);
});
```

Yield handlers are called when you yield something that is not supported by default. The first yield handler to return a promise or a thenable will be used.
If no yield handler returns a promise or a thenable then an error is raised.

An example of implementing callback support with `addYieldHandler`:

*This is a demonstration of how powerful the feature is and not the recommended usage. For best performance you need to use `promisifyAll` and yield promises directly.*

```js
var Promise = require("bluebird");
var fs = require("fs");

var _ = (function() {
    var promise = null;
    Promise.coroutine.addYieldHandler(function(v) {
        if (v === undefined && promise != null) {
            return promise;
        }
        promise = null;
    });
    return function() {
        var def = Promise.defer();
        promise = def.promise;
        return def.callback;
    };
})();


var readFileJSON = Promise.coroutine(function* (fileName) {
   var contents = yield fs.readFile(fileName, "utf8", _());
   return JSON.parse(contents);
});
```

An example of implementing thunks support with `addYieldHandler`:

*This is a demonstration of how powerful the feature is and not the recommended usage. For best performance you need to use `promisifyAll` and yield promises directly.*

```js
var Promise = require("bluebird");
var fs = require("fs");

Promise.coroutine.addYieldHandler(function(v) {
    if (typeof v === "function") {
        return Promise.fromCallback(function(cb) {
            v(cb);
        });
    }
});

var readFileThunk = function(fileName, encoding) {
    return function(cb) {
        return fs.readFile(fileName, encoding, cb);
    };
};

var readFileJSON = Promise.coroutine(function* (fileName) {
   var contents = yield readFileThunk(fileName, "utf8");
   return JSON.parse(contents);
});
```

An example of handling promises in parallel by adding an `addYieldHandler` for arrays :

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

var readFiles = Promise.coroutine(function* (fileNames) {
   return yield fileNames.map(function (fileName) {
      return fs.readFileAsync(fileName, "utf8");
   });
});
```

A custom yield handler can also be used just for a single call to `Promise.coroutine()`:

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

var readFiles = Promise.coroutine(function* (fileNames) {
   return yield fileNames.map(function (fileName) {
      return fs.readFileAsync(fileName, "utf8");
   });
}, {
   yieldHandler: function(yieldedValue) {
      if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
   }
});
```
</markdown></div>
