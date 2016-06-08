---
layout: api
id: catch
title: .catch
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.catch

`.catch` is a convenience method for handling errors in promise chains. 
It comes in two variants 
 - A catch-all variant similar to the synchronous `catch(e) {` block. This variant is compatible with native promises. 
 - A filtered variant (like other non-JS languages typically have) that lets you only handle specific errors. **This variant is usually preferable and is significantly safer**. 

### A note on promise exception handling.

Promise exception handling mirrors native exception handling in JavaScript. A synchronous function `throw`ing is similar to a promise rejecting. Here is an example to illustrate it:

```js
function getItems(parma) {
    try { 
        var items = getItemsSync();
        if(!items) throw new InvalidItemsError();  
    } catch(e) { 
        // can address the error here, either from getItemsSync returning a falsey value or throwing itself
        throw e; // need to re-throw the error unless I want it to be considered handled. 
    }
    return process(items);
}
```

Similarly, with promises:

```js
function getItems(param) {
    return getItemsAsync().then(items => {
        if(!items) throw new InvalidItemsError(); 
        return items;
    }).catch(e => {
        // can address the error here and recover from it, from getItemsAsync rejects or returns a falsey value
        throw e; // Need to rethrow unless we actually recovered, just like in the synchronous version
    }).then(process);
}
```

### Catch-all

```js
.catch(function(any error) handler) -> Promise
```
```js
.caught(function(any error) handler) -> Promise
```

This is a catch-all exception handler, shortcut for calling [`.then(null, handler)`](.) on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

*For compatibility with earlier ECMAScript versions, an alias `.caught` is provided for [`.catch`](.).*

### Filtered Catch 

```js
.catch(
    class ErrorClass|function(any error)|Object predicate...,
    function(any error) handler
) -> Promise
```
```js
.caught(
    class ErrorClass|function(any error)|Object predicate...,
    function(any error) handler
) -> Promise
```
This is an extension to [`.catch`](.) to work more like catch-clauses in languages like Java or C#. Instead of manually checking `instanceof` or `.name === "SomeError"`, you may specify a number of error constructors which are eligible for this catch handler. The catch handler that is first met that has eligible constructors specified, is the one that will be called.

Example:

```js
somePromise.then(function() {
    return a.b.c.d();
}).catch(TypeError, function(e) {
    //If it is a TypeError, will end up here because
    //it is a type error to reference property of undefined
}).catch(ReferenceError, function(e) {
    //Will end up here if a was never declared at all
}).catch(function(e) {
    //Generic catch-the rest, error wasn't TypeError nor
    //ReferenceError
});
 ```

You may also add multiple filters for a catch handler:

```js
somePromise.then(function() {
    return a.b.c.d();
}).catch(TypeError, ReferenceError, function(e) {
    //Will end up here on programmer error
}).catch(NetworkError, TimeoutError, function(e) {
    //Will end up here on expected everyday network errors
}).catch(function(e) {
    //Catch any unexpected errors
});
```

For a parameter to be considered a type of error that you want to filter, you need the constructor to have its `.prototype` property be `instanceof Error`.

Such a constructor can be minimally created like so:

```js
function MyCustomError() {}
MyCustomError.prototype = Object.create(Error.prototype);
```

Using it:

```js
Promise.resolve().then(function() {
    throw new MyCustomError();
}).catch(MyCustomError, function(e) {
    //will end up here now
});
```

However if you  want stack traces and cleaner string output, then you should do:

*in Node.js and other V8 environments, with support for `Error.captureStackTrace`*

```js
function MyCustomError(message) {
    this.message = message;
    this.name = "MyCustomError";
    Error.captureStackTrace(this, MyCustomError);
}
MyCustomError.prototype = Object.create(Error.prototype);
MyCustomError.prototype.constructor = MyCustomError;
```

Using CoffeeScript's `class` for the same:

```coffee
class MyCustomError extends Error
  constructor: (@message) ->
    @name = "MyCustomError"
    Error.captureStackTrace(this, MyCustomError)
```

This method also supports predicate-based filters. If you pass a
predicate function instead of an error constructor, the predicate will receive
the error as an argument. The return result of the predicate will be used
determine whether the error handler should be called.

Predicates should allow for very fine grained control over caught errors:
pattern matching, error-type sets with set operations and many other techniques
can be implemented on top of them.

Example of using a predicate-based filter:

```js
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));

function ClientError(e) {
    return e.code >= 400 && e.code < 500;
}

request("http://www.google.com").then(function(contents) {
    console.log(contents);
}).catch(ClientError, function(e) {
   //A client error like 400 Bad Request happened
});
```

Predicate functions that only check properties have a handy shorthand. In place of a predicate function, you can pass an object, and its properties will be checked against the error object for a match:

```js
fs.readFileAsync(...)
    .then(...)
    .catch({code: 'ENOENT'}, function(e) {
        console.log("file not found: " + e.path);
    });
```

The object predicate passed to `.catch` in the above code (`{code: 'ENOENT'}`) is shorthand for a predicate function `function predicate(e) { return isObject(e) && e.code == 'ENOENT' }`, I.E. loose equality is used.

*For compatibility with earlier ECMAScript version, an alias `.caught` is provided for [`.catch`](.).*
</markdown></div>

By not returning a rejected value or `throw`ing from a catch, you "recover from failure" and continue the chain:

```js
Promise.reject(Error('fail!'))
  .catch(function(e) {
    // fallback with "recover from failure"
    return Promise.resolve('success!'); // promise or value
  })
  .then(function(result) {
    console.log(result); // will print "success!"
  });
```

This is exactly like the synchronous code:

```js
var result;
try {
  throw Error('fail');
} catch(e) {
  result = 'success!';
}
console.log(result);
```

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".catch";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-catch";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
