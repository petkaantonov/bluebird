---
id: api-reference
title: API Reference
---


<div class="api-reference-menu">
<markdown>

- [Core](#core)
    - [new Promise](#new-promise)
    - [.then](#.then)
    - [.spread](#.spread)
    - [.catch](#.catch)
    - [.error](#.error)
    - [.finally](#.finally)
    - [.bind](#.bind)
    - [Promise.join](#promise.join)
    - [Promise.try](#promise.try)
    - [Promise.method](#promise.method)
    - [Promise.resolve](#promise.resolve)
    - [Promise.reject](#promise.reject)
- [Synchronous inspection](#synchronous-inspection)
    - [PromiseInspection](#promiseinspection)
    - [.isFulfilled](#.isfulfilled)
    - [.isRejected](#.isrejected)
    - [.isPending](#.ispending)
    - [.value](#.value)
    - [.reason](#.reason)
- [Collections](#collections)
    - [.all](#promise.all)
    - [.props](#promise.props)
    - [.any](#promise.any)
    - [.race](#promise.race)
    - [.some](#promise.some)
    - [.map](#promise.map)
    - [.reduce](#promise.reduce)
    - [.filter](#promise.filter)
    - [.each](#promise.each)
- [Resource management](#resource-management)
    - [Promise.using](#promise.using)
    - [.disposer](#.disposer)
- [Promisification](#promisification)
    - [Promise.promisify](#promise.promisify)
    - [Promise.promisifyAll](#promise.promisifyall)
    - [Promise.fromCallback](#promise.fromcallback)
    - [.asCallback](#.ascallback)
- [Timers](#timers)
    - [.delay](#.delay)
    - [.timeout](#.timeout)
- [Cancellation](#cancellation)
    - [.cancellable](#.cancellable)
    - [.uncancellable](#.uncancellable)
    - [.cancel](#.cancel)
    - [.isCancellable](#.iscancellable)
- [Generators](#generators)
    - [Promise.coroutine](#promise.coroutine)
    - [Promise.coroutine.addYieldHandler](#promise.coroutine.addyieldhandler)
- [Utility](#utility)
    - [.tap](#.tap)
    - [.call](#.call)
    - [.get](#.get)
    - [.return](#.return)
    - [.throw](#.throw)
    - [.catchReturn](#.catchreturn)
    - [.catchThrow](#.catchthrow)
    - [.reflect](#.reflect)
    - [Promise.noConflict](#promise.noconflict)
    - [Promise.setScheduler](#promise.setscheduler)
- [Built-in error types](#built-in-error-types)
    - [OperationalError](#operationalerror)
    - [TimeoutError](#timeouterror)
    - [CancellationError](#cancellationerror)
    - [AggregateError](#aggregateerror)
- [Configuration](#error-management-configuration)
    - [Rejection events](#global-rejection-events)
    - [Promise.config](#promise.config)
    - [.suppressUnhandledRejections](#.suppressunhandledrejections)
    - [.done](#.done)
- [Progression migration](#progression-migration)
- [Deferred migration](#deferred-migration)
- [Environment variables](#environment-variables)

</markdown>
</div>

##Core
Core methods of `Promise` instances and core static methods of the Promise class.

<div class="api-code-section"><markdown>
##new Promise

```js
new Promise(function(function resolve, function reject) resolver) -> Promise
```


Create a new promise. The passed in function will receive functions `resolve` and `reject` as its arguments which can be called to seal the fate of the created promise.

*Note: See [explicit construction anti-pattern]({{ "/docs/anti-patterns.html#explicit-construction-anti-pattern" | prepend: site.baseurl }}) before creating promises yourself*

Example:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    });
}
```

If you pass a promise object to the `resolve` function, the created promise will follow the state of that promise.

<hr>

To make sure a function that returns a promise is following the implicit but critically important contract of promises, you can start a function with `new Promise` if you cannot start a chain immediately:

```js
function getConnection(urlString) {
    return new Promise(function(resolve) {
        //Without new Promise, this throwing will throw an actual exception
        var params = parse(urlString);
        resolve(getAdapater(params).getConnection());
    });
}
```

The above ensures `getConnection` fulfills the contract of a promise-returning function of never throwing a synchronous exception. Also see [`Promise.try`](.) and [`Promise.method`](.)

The resolver is called synchronously (the following is for documentation purposes and not idiomatic code):

```js
function getPromiseResolveFn() {
    var res;
    new Promise(function (resolve) {
        res = resolve;
    });
    // res is guaranteed to be set
    return res;
}
```


<hr>

##.then

```js
.then(
    [function(any value) fulfilledHandler],
    [function(any error) rejectedHandler]
) -> Promise
```


[Promises/A+ `.then`](http://promises-aplus.github.io/promises-spec/). If you are new to promises, see the [Beginner's Guide]({{ "/docs/beginners-guide.html" | prepend: site.baseurl }}).

<hr>

##.spread

```js
.spread(
    [function(any values...) fulfilledHandler]
) -> Promise
```


Like calling `.then`, but the fulfillment value _must be_ an array, which is flattened to the formal parameters of the fulfillment handler.


```js
Promise.delay(500).then(function() {
   return [fs.readFileAsync("file1.txt"),
           fs.readFileAsync("file2.txt")] ;
}).spread(function(file1text, file2text) {
    if (file1text !== file2text) {
        console.log("files are equal");
    }
    else {
        console.log("files are not equal");
    }
});
```

If using ES6, the above can be replaced with [.then()](.) and destructuring:

```js
Promise.delay(500).then(function() {
   return [fs.readFileAsync("file1.txt"),
           fs.readFileAsync("file2.txt")] ;
}).all().then(function([file1text, file2text]) {
    if (file1text !== file2text) {
        console.log("files are equal");
    }
    else {
        console.log("files are not equal");
    }
});
```

Note that [.spread()](.) implicitly does [.all()](.) but the ES6 destructuring syntax doesn't, hence the manual `.all()` call in the above code.

If you want to coordinate several discrete concurrent promises, use [`Promise.join`](.)

<hr>

##.catch

```js
.catch(function(any error) handler) -> Promise
```
```js
.caught(function(any error) handler) -> Promise
```

This is a catch-all exception handler, shortcut for calling [`.then(null, handler)`](.) on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

*For compatibility with earlier ECMAScript version, an alias `.caught` is provided for [`.catch`](.).*

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
    //If a is defined, will end up here because
    //it is a type error to reference property of undefined
}).catch(ReferenceError, function(e) {
    //Will end up here if a wasn't defined at all
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

<hr>

##.error

```js
.error([function(any error) rejectedHandler]) -> Promise
```


Like [`.catch`](.) but instead of catching all types of exceptions, it only catches operational errors.

*Note, "errors" mean errors, as in objects that are `instanceof Error` - not strings, numbers and so on. See [a string is not an error](http://www.devthought.com/2011/12/22/a-string-is-not-an-error/).*

It is equivalent to the following [`.catch`](.) pattern:

```js
// Assumes OperationalError has been made global
function isOperationalError(e) {
    if (e == null) return false;
    return (e instanceof OperationalError) || (e.isOperational === true);
}

// Now this bit:
.catch(isOperationalError, function(e) {
    // ...
})

// Is equivalent to:

.error(function(e) {
    // ...
});
```

For example, if a promisified function errbacks the node-style callback with an error, that could be caught with [`.error`](.). However if the node-style callback **throws** an error, only `.catch` would catch that.

In the following example you might want to handle just the `SyntaxError` from JSON.parse and Filesystem errors from `fs` but let programmer errors bubble as unhandled rejections:

```js
var fs = Promise.promisifyAll(require("fs"));

fs.readFileAsync("myfile.json").then(JSON.parse).then(function (json) {
    console.log("Successful json")
}).catch(SyntaxError, function (e) {
    console.error("file contains invalid json");
}).error(function (e) {
    console.error("unable to read file, because: ", e.message);
});
```

Now, because there is no catch-all handler, if you typed `console.lag` (causes an error you don't expect), you will see:

```
Possibly unhandled TypeError: Object #<Console> has no method 'lag'
    at application.js:8:13
From previous event:
    at Object.<anonymous> (application.js:7:4)
    at Module._compile (module.js:449:26)
    at Object.Module._extensions..js (module.js:467:10)
    at Module.load (module.js:349:32)
    at Function.Module._load (module.js:305:12)
    at Function.Module.runMain (module.js:490:10)
    at startup (node.js:121:16)
    at node.js:761:3
```

*( If you don't get the above - you need to enable [long stack traces](#promiselongstacktraces---undefined) )*

And if the file contains invalid JSON:

```
file contains invalid json
```

And if the `fs` module causes an error like file not found:

```
unable to read file, because:  ENOENT, open 'not_there.txt'
```

<hr>

##.finally

```js
.finally(function() handler) -> Promise
```
```js
.lastly(function() handler) -> Promise
```


Pass a handler that will be called regardless of this promise's fate. Returns a new promise chained from this promise. There are special semantics for [`.finally`](.) in that the final value cannot be modified from the handler.

*Note: using [`.finally`](.) for resource management has better alternatives, see [resource management](#resource-management)*

Consider the example:

```js
function anyway() {
    $("#ajax-loader-animation").hide();
}

function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).then(anyway, anyway);
}
```

This example doesn't work as intended because the `then` handler actually swallows the exception and returns `undefined` for any further chainers.

The situation can be fixed with `.finally`:

```js
function ajaxGetAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).finally(function() {
        $("#ajax-loader-animation").hide();
    });
}
```

Now the animation is hidden but an exception or the actual return value will automatically skip the finally and propagate to further chainers. This is more in line with the synchronous `finally` keyword.

*For compatibility with earlier ECMAScript version, an alias `.lastly` is provided for [`.finally`](.).*

<hr>

##.bind

```js
.bind(any|Promise<any> thisArg) -> BoundPromise
```

Same as calling [Promise.bind(thisArg, thisPromise)](.).

##Promise.bind

```js
Promise.bind(
    any|Promise<any> thisArg,
    [any|Promise<any> value=undefined]
) -> BoundPromise
```

Create a promise that follows this promise or in the static method is resolved with the given `value`, but is bound to the given `thisArg` value. A bound promise will call its handlers with the bound value set to `this`. Additionally promises derived from a bound promise will also be bound promises with the same `thisArg` binding as the original promise.

If `thisArg` is a promise or thenable, its resolution will be awaited for and the bound value will be the promise's fulfillment value. If `thisArg` rejects
then the returned promise is rejected with the `thisArg's` rejection reason. Note that this means you cannot use `this` without checking inside catch handlers for promises that bind to promise because in case of rejection of `thisArg`, `this` will be `undefined`.

<hr>

Without arrow functions that provide lexical `this`, the correspondence between async and sync code breaks down when writing object-oriented code. [`.bind`](.) alleviates this.

Consider:

```js
MyClass.prototype.method = function() {
    try {
        var contents = fs.readFileSync(this.file);
        var url = urlParse(contents);
        var result = this.httpGetSync(url);
        var refined = this.refine(result);
        return this.writeRefinedSync(refined);
    }
    catch (e) {
        this.error(e.stack);
    }
};
```

The above has a direct translation:

```js
MyClass.prototype.method = function() {
    return fs.readFileAsync(this.file).bind(this)
    .then(function(contents) {
        var url = urlParse(contents);
        return this.httpGetAsync(url);
    }).then(function(result) {
        var refined = this.refine(result);
        return this.writeRefinedAsync(refined);
    }).catch(function(e) {
        this.error(e.stack);
    });
};
```

`.bind` is the most efficient way of utilizing `this` with promises. The handler functions in the above code are not closures and can therefore even be hoisted out if needed. There is literally no overhead when propagating the bound value from one promise to another.

<hr>

`.bind` also has a useful side purpose - promise handlers don't need to share a function to use shared state:

```js
somethingAsync().bind({})
.spread(function (aValue, bValue) {
    this.aValue = aValue;
    this.bValue = bValue;
    return somethingElseAsync(aValue, bValue);
})
.then(function (cValue) {
    return this.aValue + this.bValue + cValue;
});
```

The above without [`.bind`](.) could be achieved with:

```js
var scope = {};
somethingAsync()
.spread(function (aValue, bValue) {
    scope.aValue = aValue;
    scope.bValue = bValue;
    return somethingElseAsync(aValue, bValue);
})
.then(function (cValue) {
    return scope.aValue + scope.bValue + cValue;
});
```

However, there are many differences when you look closer:

- Requires a statement so cannot be used in an expression context
- If not there already, an additional wrapper function is required to aundefined leaking or sharing `scope`
- The handler functions are now closures, thus less efficient and not reusable

<hr>

Note that bind is only propagated with promise transformation. If you create new promise chains inside a handler, those chains are not bound to the "upper" `this`:

```js
something().bind(var1).then(function() {
    //`this` is var1 here
    return Promise.all(getStuff()).then(function(results) {
        //`this` is undefined here
        //refine results here etc
    });
}).then(function() {
    //`this` is var1 here
});
```

However, if you are utilizing the full bluebird API offering, you will *almost never* need to resort to nesting promises in the first place. The above should be written more like:

```js
something().bind(var1).then(function() {
    //`this` is var1 here
    return getStuff();
}).map(function(result) {
    //`this` is var1 here
    //refine result here
}).then(function() {
    //`this` is var1 here
});
```

Also see [this Stackoverflow answer]`](.) can clean up code.

<hr>

If you don't want to return a bound promise to the consumers of a promise, you can rebind the chain at the end:

```js
MyClass.prototype.method = function() {
    return fs.readFileAsync(this.file).bind(this)
    .then(function(contents) {
        var url = urlParse(contents);
        return this.httpGetAsync(url);
    }).then(function(result) {
        var refined = this.refine(result);
        return this.writeRefinedAsync(refined);
    }).catch(function(e) {
        this.error(e.stack);
    }).bind(); //The `thisArg` is implicitly undefined - I.E. the default promise `this` value
};
```

Rebinding can also be abused to do something gratuitous like this:

```js
Promise.resolve("my-element")
    .bind(document)
    .then(document.getElementById)
    .bind(console)
    .then(console.log);
```

The above does `console.log`](.)s are necessary because in browser neither of the methods can be called as a stand-alone function.

<hr>

##Promise.join

```js
Promise.join(
    Promise<any>|any values...,
    function handler
) -> Promise
```


For coordinating multiple concurrent discrete promises. While [`.all`](.) is good for handling a dynamically sized list of uniform promises, `Promise.join` is much easier (and more performant) to use when you have a fixed amount of discrete promises that you want to coordinate concurrently, for example:

```js
var Promise = require("bluebird");
var join = Promise.join;

join(getPictures(), getComments(), getTweets(),
    function(pictures, comments, tweets) {
    console.log("in total: " + pictures.length + comments.length + tweets.length);
});
```

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var pg = require("pg");
Promise.promisifyAll(pg, {
    filter: function(methodName) {
        return methodName === "connect"
    },
    multiArgs: true
});
// Promisify rest of pg normally
Promise.promisifyAll(pg);
var join = Promise.join;
var connectionString = "postgres://username:password@localhost/database";

var fContents = fs.readFileAsync("file.txt", "utf8");
var fStat = fs.statAsync("file.txt");
var fSqlClient = pg.connectAsync(connectionString).spread(function(client, done) {
    client.close = done;
    return client;
});

join(fContents, fStat, fSqlClient, function(contents, stat, sqlClient) {
    var query = "                                                              \
        INSERT INTO files (byteSize, contents)                                 \
        VALUES ($1, $2)                                                        \
    ";
   return sqlClient.queryAsync(query, [stat.size, contents]).thenReturn(query);
})
.then(function(query) {
    console.log("Successfully ran the Query: " + query);
})
.finally(function() {
    // This is why you want to use Promise.using for resource management
    if (fSqlClient.isFulfilled()) {
        fSqlClient.value().close();
    }
});
```

*Note: In 1.x and 0.x `Promise.join` used to be a `Promise.all` that took the values in as arguments instead in an array. This behavior has been deprecated but is still supported partially - when the last argument is an immediate function value the new semantics will apply*

<hr>

##Promise.try

```js
Promise.try(function() fn) -> Promise
```
```js
Promise.attempt(function() fn) -> Promise
```


Start the chain of promises with `Promise.try`. Any synchronous exceptions will be turned into rejections on the returned promise.

```js
function getUserById(id) {
    return Promise.try(function() {
        if (typeof id !== "number") {
            throw new Error("id must be a number");
        }
        return db.getUserById(id);
    });
}
```

Now if someone uses this function, they will catch all errors in their Promise `.catch` handlers instead of having to handle both synchronous and asynchronous exception flows.

*For compatibility with earlier ECMAScript version, an alias `Promise.attempt` is provided for [`Promise.try`](.).*

<hr>

##Promise.method

```js
Promise.method(function(...arguments) fn) -> function
```


Returns a new function that wraps the given function `fn`. The new function will always return a promise that is fulfilled with the original functions return values or rejected with thrown exceptions from the original function.

This method is convenient when a function can sometimes return synchronously or throw synchronously.

Example without using `Promise.method`:

```js
MyClass.prototype.method = function(input) {
    if (!this.isValid(input)) {
        return Promise.reject(new TypeError("input is not valid"));
    }

    if (this.cache(input)) {
        return Promise.resolve(this.someCachedValue);
    }

    return db.queryAsync(input).bind(this).then(function(value) {
        this.someCachedValue = value;
        return value;
    });
};
```

Using the same function `Promise.method`, there is no need to manually wrap direct return or throw values into a promise:

```js
MyClass.prototype.method = Promise.method(function(input) {
    if (!this.isValid(input)) {
        throw new TypeError("input is not valid");
    }

    if (this.cache(input)) {
        return this.someCachedValue;
    }

    return db.queryAsync(input).bind(this).then(function(value) {
        this.someCachedValue = value;
        return value;
    });
});
```

<hr>

##Promise.resolve

```js
Promise.resolve(Promise<any>|any value) -> Promise
```


Create a promise that is resolved with the given value. If `value` is already a trusted `Promise`, it is returned as is. If `value` is not a thenable, a fulfilled Promise is returned with `value` as its fulfillment value. If `value` is a thenable (Promise-like object, like those returned by jQuery's `$.ajax`), returns a trusted Promise that assimilates the state of the thenable.

Example: (`$` is jQuery)

```js
Promise.resolve($.get("http://www.google.com")).then(function() {
    //Returning a thenable from a handler is automatically
    //cast to a trusted Promise as per Promises/A+ specification
    return $.post("http://www.yahoo.com");
}).then(function() {

}).catch(function(e) {
    //jQuery doesn't throw real errors so use catch-all
    console.log(e.statusText);
});
```

<hr>

##Promise.reject

```js
Promise.reject(any error) -> Promise
```


Create a promise that is rejected with the given `error`.

</markdown></div>

##Synchronous inspection

Often it is known in certain code paths that a promise is guaranteed to be fulfilled at that point - it would then be extremely inconvenient to use [`.then`](.) to get at the promise's value as the callback is always called asynchronously.


**Note**: In recent versions of Bluebird a design choice was made to expose [.reason()](.) and [.value()](.) as well as other inspection methods on promises directly in order to make the below use case easier to work with. Every promise implements the [PromiseInspection](.) interface.

For example, if you need to use values of earlier promises in the chain, you could nest:


```js
// From Q Docs https://github.com/kriskowal/q/#chaining
// MIT License Copyright 2009–2014 Kristopher Michael Kowal.
function authenticate() {
    return getUsername().then(function (username) {
        return getUser(username);
    // chained because we will not need the user name in the next event
    }).then(function (user) {
        // nested because we need both user and password next
        return getPassword().then(function (password) {
            if (user.passwordHash !== hash(password)) {
                throw new Error("Can't authenticate");
            }
        });
    });
}
```

Or you could take advantage of the fact that if we reach password validation, then the user promise must be fulfilled:

```js
function authenticate() {
    var user = getUsername().then(function(username) {
        return getUser(username);
    });

    return user.then(function(user) {
        return getPassword();
    }).then(function(password) {
        // Guaranteed that user promise is fulfilled, so .value() can be called here
        if (user.value().passwordHash !== hash(password)) {
            throw new Error("Can't authenticate");
        }
    });
}
```

In the latter the indentation stays flat no matter how many previous variables you need, whereas with the former each additional previous value would require an additional nesting level.

<div class="api-code-section"><markdown>


##PromiseInspection

```js
interface PromiseInspection {
    any reason()
    any value()
    boolean pending()
    boolean isRejected()
    boolean isFulfilled()
}
```

This interface is implemented by `Promise` instances as well as the `PromiseInspection` result given by [.reflect()](.).

<hr>

##.isFulfilled

```js
.isFulfilled() -> boolean
```

See if this `promise` has been fulfilled.

<hr>

##.isRejected

```js
.isRejected() -> boolean
```


See if this `promise` has been rejected.

<hr>

##.isPending

```js
.isPending() -> boolean
```


See if this `promise` is pending (not fulfilled or rejected).

<hr>

##.value

```js
.value() -> any
```


Get the fulfillment value of this promise. Throws an error if the promise isn't fulfilled - it is a bug to call this method on an unfulfilled promise.

You should check if this promise is [.isFulfilled()](.) in code paths where it's guaranteed that this promise is fulfilled.

<hr>

##.reason

```js
.reason() -> any
```


Get the rejection reason of this promise. Throws an error if the promise isn't rejected - it is a bug to call this method on an unrejected promise.

You should check if this promise is [.isRejected()](.) in code paths where it's guaranteed that this promise is rejected.

<hr>

</markdown></div>

##Collections

Methods of `Promise` instances and core static methods of the Promise class to deal with collections of promises or mixed promises and values.

All collection methods have a static equivalent on the Promise object, e.g. `somePromise.map(...)...` is same as `Promise.map(somePromise, ...)...`,
`somePromise.all` is same as [`Promise.all`](.) and so on.

None of the collection methods modify the original input. Holes in arrays are treated as if they were defined with the value `undefined`.

<div class="api-code-section"><markdown>


##.all

```js
.all() -> Promise
```

Same as [Promise.all(this)](.).

##Promise.all

```js
Promise.all(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and return a promise that is fulfilled when all the items in the array are fulfilled. The promise's fulfillment value is an array with fulfillment values at respective positions to the original array. If any promise in the array rejects, the returned promise is rejected with the rejection reason.

```js
var files = [];
for (var i = 0; i < 100; ++i) {
    files.push(fs.writeFileAsync("file-" + i + ".txt", "", "utf-8"));
}
Promise.all(files).then(function() {
    console.log("all the files were created");
});
```

<hr>


##.props

```js
.props() -> Promise
```

Same as [Promise.props(this)](.).

##Promise.props

```js
Promise.props(Object|Map|Promise<Object|Map> input) -> Promise
```

Like [`.all`](.) but for object properties or `Map`s\* entries instead of iterated values. Returns a promise that is fulfilled when all the properties of the object or the `Map`'s' values\*\* are fulfilled. The promise's fulfillment value is an object or a `Map` with fulfillment values at respective keys to the original object or a `Map`. If any promise in the object or `Map` rejects, the returned promise is rejected with the rejection reason.

If `object` is a trusted `Promise`, then it will be treated as a promise for object rather than for its properties. All other objects (except `Map`s) are treated for their properties as is returned by `Object.keys` - the object's own enumerable properties.

*\*Only the native [ECMAScript 6 `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) implementation that is provided by the environment as is is supported*

*\*\*If the map's keys happen to be `Promise`s, they are not awaited for and the resulting `Map` will still have those same `Promise` instances as keys*


```js
Promise.props({
    pictures: getPictures(),
    comments: getComments(),
    tweets: getTweets()
}).then(function(result) {
    console.log(result.tweets, result.pictures, result.comments);
});
```

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var _ = require("lodash");
var path = require("path");
var util = require("util");

function directorySizeInfo(root) {
    var counts = {dirs: 0, files: 0};
    var stats = (function reader(root) {
        return fs.readdirAsync(root).map(function(fileName) {
            var filePath = path.join(root, fileName);
            return fs.statAsync(filePath).then(function(stat) {
                stat.filePath = filePath;
                if (stat.isDirectory()) {
                    counts.dirs++;
                    return reader(filePath)
                }
                counts.files++;
                return stat;
            });
        }).then(_.flatten);
    })(root).then(_);

    var smallest = stats.call("min", "size").call("pick", "size", "filePath").call("value");
    var largest = stats.call("max", "size").call("pick", "size", "filePath").call("value");
    var totalSize = stats.call("pluck", "size").call("reduce", function(a, b) {
        return a + b;
    }, 0);

    return Promise.props({
        counts: counts,
        smallest: smallest,
        largest: largest,
        totalSize: totalSize
    });
}


directorySizeInfo(process.argv[2] || ".").then(function(sizeInfo) {
    console.log(util.format("                                                \n\
        %d directories, %d files                                             \n\
        Total size: %d bytes                                                 \n\
        Smallest file: %s with %d bytes                                      \n\
        Largest file: %s with %d bytes                                       \n\
    ", sizeInfo.counts.dirs, sizeInfo.counts.files, sizeInfo.totalSize,
        sizeInfo.smallest.filePath, sizeInfo.smallest.size,
        sizeInfo.largest.filePath, sizeInfo.largest.size));
});
```

Note that if you have no use for the result object other than retrieving the properties, it is more convenient to use [`Promise.join`](.):

```js
Promise.join(getPictures(), getComments(), getTweets(),
    function(pictures, comments, tweets) {
    console.log(pictures, comments, tweets);
});
```

<hr>

##.any

```js
.any() -> Promise
```

Same as [Promise.any(this)](.).

##Promise.any

```js
Promise.any(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Like [Promise.some](.), with 1 as `count`. However, if the promise fulfills, the fulfillment value is not an array of 1 but the value directly.

<hr>

##.race

```js
.race() -> Promise
```

Same as [Promise.race(this)](.).


##Promise.race

```js
Promise.race(Iterable<any>|Promise<Iterable<any>> input) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and return a promise that is fulfilled or rejected as soon as a promise in the array is fulfilled or rejected with the respective rejection reason or fulfillment value.

This method is only implemented because it's in the ES6 standard. If you want to race promises to fulfillment the [`.any`](.) method is more appropriate as it doesn't qualify a rejected promise as the winner. It also has less surprises: `.race` must become infinitely pending if an empty array is passed but passing an empty array to [`.any`](.) is more usefully a `RangeError`

<hr>


##.some

```js
.some(int count) -> Promise
```

Same as [Promise.some(this, count)](.).

##Promise.some

```js
Promise.some(
    Iterable<any>|Promise<Iterable<any>> input,
    int count
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and return a promise that is fulfilled as soon `count` promises are fulfilled in the array. The fulfillment value is an array with `count` values in the order they were fulfilled.

This example pings 4 nameservers, and logs the fastest 2 on console:

```js
Promise.some([
    ping("ns1.example.com"),
    ping("ns2.example.com"),
    ping("ns3.example.com"),
    ping("ns4.example.com")
], 2).spread(function(first, second) {
    console.log(first, second);
});
```

If too many promises are rejected so that the promise can never become fulfilled, it will be immediately rejected with an [AggregateError](.) of the rejection reasons in the order they were thrown in.

You can get a reference to [AggregateError](.) from `Promise.AggregateError`.

```js
Promise.some(...)
    .then(...)
    .then(...)
    .catch(Promise.AggregateError, function(err) {
        err.forEach(function(e) {
            console.error(e.stack);
        });
    });
```

<hr>

##.map

```js
.map(
    function(any item, int index, int length) mapper,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Same as [Promise.map(this, mapper, options)](.).

##Promise.map

```js
Promise.map(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) mapper,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and [map the array to another](http://en.wikipedia.org/wiki/Map_\(higher-order_function\)) using the given `mapper` function.

Promises returned by the `mapper` function are awaited for and the returned promise doesn't fulfill until all mapped promises have fulfilled as well. If any promise in the array is rejected, or any promise returned by the `mapper` function is rejected, the returned promise is rejected as well.

The mapper function for a given item is called as soon as possible, that is, when the promise for that item's index in the input array is fulfilled. This doesn't mean that the result array has items in random order, it means that `.map` can be used for concurrency coordination unlike `.all`.

A common use of `Promise.map` is to replace the `.push`+`Promise.all` boilerplate:

```js
var promises = [];
for (var i = 0; i < fileNames.length; ++i) {
    promises.push(fs.readFileAsync(fileNames[i]));
}
Promise.all(promises).then(function() {
    console.log("done");
});

// Using Promise.map:
Promise.map(fileNames, function(fileName) {
    // Promise.map awaits for returned promises as well.
    return fs.readFileAsync(fileName);
}).then(function() {
    console.log("done");
});

```

A more involved example:

```js
var Promise = require("bluebird");
var join = Promise.join;
var fs = Promise.promisifyAll(require("fs"));
fs.readdirAsync(".").map(function(fileName) {
    var stat = fs.statAsync(fileName);
    var contents = fs.readFileAsync(fileName).catch(function ignore() {});
    return join(stat, contents, function(stat, contents) {
        return {
            stat: stat,
            fileName: fileName,
            contents: contents
        }
    });
// The return value of .map is a promise that is fulfilled with an array of the mapped values
// That means we only get here after all the files have been statted and their contents read
// into memory. If you need to do more operations per file, they should be chained in the map
// callback for concurrency.
}).call("sort", function(a, b) {
    return a.fileName.localeCompare(b.fileName);
}).each(function(file) {
    var contentLength = file.stat.isDirectory() ? "(directory)" : file.contents.length + " bytes";
    console.log(file.fileName + " last modified " + file.stat.mtime + " " + contentLength)
});
```

####Map Option: concurrency

You may optionally specify a concurrency limit:

```js
...map(..., {concurrency: 3});
```

The concurrency limit applies to Promises returned by the mapper function and it basically limits the number of Promises created. For example, if `concurrency` is `3` and the mapper callback has been called enough so that there are three returned Promises currently pending, no further callbacks are called until one of the pending Promises resolves. So the mapper function will be called three times and it will be called again only after at least one of the Promises resolves.

Playing with the first example with and without limits, and seeing how it affects the duration when reading 20 files:

```js
var Promise = require("bluebird");
var join = Promise.join;
var fs = Promise.promisifyAll(require("fs"));
var concurrency = parseFloat(process.argv[2] || "Infinity");
console.time("reading files");
fs.readdirAsync(".").map(function(fileName) {
    var stat = fs.statAsync(fileName);
    var contents = fs.readFileAsync(fileName).catch(function ignore() {});
    return join(stat, contents, function(stat, contents) {
        return {
            stat: stat,
            fileName: fileName,
            contents: contents
        }
    });
// The return value of .map is a promise that is fulfilled with an array of the mapped values
// That means we only get here after all the files have been statted and their contents read
// into memory. If you need to do more operations per file, they should be chained in the map
// callback for concurrency.
}, {concurrency: concurrency}).call("sort", function(a, b) {
    return a.fileName.localeCompare(b.fileName);
}).then(function() {
    console.timeEnd("reading files");
});
```

```bash
$ sync && echo 3 > /proc/sys/vm/drop_caches
$ node test.js 1
reading files 35ms
$ sync && echo 3 > /proc/sys/vm/drop_caches
$ node test.js Infinity
reading files: 9ms
```

<hr>

##.reduce

```js
.reduce(
    function(any previousValue, any currentValue, int index, int length) reducer,
    [any initialValue]
) -> Promise
```

Same as [Promise.reduce(this, reducer, initialValue)](.).

##Promise.reduce

```js
Promise.reduce(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any accumulator, any item, int index, int length) reducer,
    [any initialValue]
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and [reduce the array to a value](http://en.wikipedia.org/wiki/Fold_\(higher-order_function\)) using the given `reducer` function.

If the reducer function returns a promise, then the result of the promise is awaited, before continuing with next iteration. If any promise in the array is rejected or a promise returned by the reducer function is rejected, the result is rejected as well.

Read given files sequentially while summing their contents as an integer. Each file contains just the text `10`.

```js
Promise.reduce(["file1.txt", "file2.txt", "file3.txt"], function(total, fileName) {
    return fs.readFileAsync(fileName, "utf8").then(function(contents) {
        return total + parseInt(contents, 10);
    });
}, 0).then(function(total) {
    //Total is 30
});
```

*If `intialValue` is `undefined` (or a promise that resolves to `undefined`) and the iterable contains only 1 item, the callback will not be called and `undefined` is returned. If the iterable is empty, the callback will not be called and `initialValue` is returned (which may be `undefined`).*

`Promise.reduce` will start calling the reducer as soon as possible, this is why you might want to use it over `Promise.all` (which awaits for the entire array before you can call [`Array#reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) on it).

<hr>

##.filter

```js
.filter(
    function(any item, int index, int length) filterer,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Same as [Promise.filter(this, filterer, options)](.).

##Promise.filter

```js
Promise.filter(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) filterer,
    [Object {concurrency: int=Infinity} options]
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and [filter the array to another](http://en.wikipedia.org/wiki/Filter_\(higher-order_function\)) using the given `filterer` function.


It is essentially an efficient shortcut for doing a [.map](.) and then [`Array#filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter):

```js
Promise.map(valuesToBeFiltered, function(value, index, length) {
    return Promise.all([filterer(value, index, length), value]);
}).then(function(values) {
    return values.filter(function(stuff) {
        return stuff[0] == true
    }).map(function(stuff) {
        return stuff[1];
    });
});
```

Example for filtering files that are accessible directories in the current directory:

```js
var Promise = require("bluebird");
var E = require("core-error-predicates");
var fs = Promise.promisifyAll(require("fs"));

fs.readdirAsync(process.cwd()).filter(function(fileName) {
    return fs.statAsync(fileName)
        .then(function(stat) {
            return stat.isDirectory();
        })
        .catch(E.FileAccessError, function() {
            return false;
        });
}).each(function(directoryName) {
    console.log(directoryName, " is an accessible directory");
});
```

####Filter Option: concurrency

See [Map Option: concurrency](#map-option-concurrency)

<hr>

##.each

```js
.each(function(any item, int index, int length) iterator) -> Promise
```
```js
.mapSeries(function(any item, int index, int length) mapper) -> Promise
```

Same as [Promise.each(this, iterator)](.).

##Promise.each

```js
Promise.each(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) iterator
) -> Promise
```
```js
Promise.mapSeries(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) mapper
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and iterate over the array serially, in-order.

Returns a promise for an array that contains the values returned by the `iterator` function in their respective positions. The iterator won't be called for an item until its previous item, and the promise returned by the iterator for that item are fulfilled. This results in a `mapSeries` kind of utility but it can also be used simply as a side effect iterator similar to [`Array#forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).

If any promise in the input array is rejected or any promise returned by the iterator function is rejected, the result will be rejected as well.

Example where [.each](.)\(the instance method\) is used for iterating with side effects:

```js
// Source: http://jakearchibald.com/2014/es7-async-functions/
function loadStory() {
  return getJSON('story.json')
    .then(function(story) {
      addHtmlToPage(story.heading);
      return story.chapterURLs.map(getJSON);
    })
    .each(function(chapter) { addHtmlToPage(chapter.html); })
    .then(function() { addTextToPage("All done"); })
    .catch(function(err) { addTextToPage("Argh, broken: " + err.message); })
    .then(function() { document.querySelector('.spinner').style.display = 'none'; });
}
```

The alias `mapSeries` is provided for an opportunity to be more explicit when using `.each` as a linear mapping operation instead of a side effect iterator.

<hr>

</markdown></div>

##Resource management

Managing resources properly without leaks can be challenging. Simply using `.finally` is not enough as the following example demonstrates:

```js
function doStuff() {
    return Promise.all([
        connectionPool.getConnectionAsync(),
        fs.readFileAsync("file.sql", "utf8")
    ]).spread(function(connection, fileContents) {
        return connection.query(fileContents).finally(function() {
            connection.close();
        });
    }).then(function() {
        console.log("query successful and connection closed");
    });
}
```

It is very subtle but over time this code will exhaust the entire connection pool and the server needs to be restarted. This is because
reading the file may fail and then of course `.spread` is not called at all and thus the connection is not closed.

One could solve this by either reading the file first or connecting first, and only proceeding if the first step succeeds. However,
this would lose a lot of the benefits of using asynchronity and we might almost as well go back to using simple synchronous code.

We can do better, retaining concurrency and not leaking resources, by using undefined:

```js
var using = Promise.using;

using(getConnection(),
      fs.readFileAsync("file.sql", "utf8"), function(connection, fileContents) {
    return connection.query(fileContents);
}).then(function() {
    console.log("query successful and connection closed");
});
```

<div class="api-code-section"><markdown>

##Promise.using

```js
Promise.using(
    Promise|Disposer|any resource,
    Promise|Disposer|any resource...,
    function(any resources...) handler
) -> Promise
```


In conjunction with [`.disposer`](.), `using` will make sure that no matter what, the specified disposer will be called when the promise returned by the callback passed to `using` has settled. The disposer is necessary because there is no standard interface in node for disposing resources.

Here is a simple example ` [has been defined] to return a proper undefined))


```js
using(getConnection(), function(connection) {
   // Don't leak the `connection` variable anywhere from here
   // it is only guaranteed to be open while the promise returned from
   // this callback is still pending
   return connection.queryAsync("SELECT * FROM TABLE");
   // Code that is chained from the promise created in the line above
   // still has access to `connection`
}).then(function(rows) {
    // The connection has been closed by now
    console.log(rows);
});
```

Using multiple resources:

```js
using(getConnection(), function(conn1) {
    return using(getConnection(), function(conn2) {
        // use conn1 and conn 2 here
    });
}).then(function() {
    // Both connections closed by now
})
```

The above can also be written as (with a caveat, see below)

```js
using(getConnection(), getConnection(), function(conn1, conn2) {
    // use conn1 and conn2
}).then(function() {
    // Both connections closed by now
})
```

However, if the second `getConnection` throws **synchronously**, the first connection is leaked. This will not happen
when using APIs through bluebird promisified methods though. You can wrap functions that could throw in [`Promise.method`](.) which will turn synchronous rejections into rejected promises.

Note that you can mix promises and disposers, so that you can acquire all the things you need in parallel instead of sequentially

```js
// The files don't need resource management but you should
// still start the process of reading them even before you have the connection
// instead of waiting for the connection

// The connection is always closed, no matter what fails at what point
using(readFile("1.txt"), readFile("2.txt"), getConnection(), function(txt1, txt2, conn) {
    // use conn and have access to txt1 and txt2
});
```
<hr>

##.disposer

```js
.disposer(function(any resource, Promise usingOutcomePromise) disposer) -> Disposer
```


A meta method used to specify the disposer method that cleans up a resource when using undefined.

Example:

```js
// This function doesn't return a promise but a Disposer
// so it's very hard to use it wrong (not passing it to `using`)
function getConnection() {
    return pool.getConnectionAsync().disposer(function(connection, promise) {
        connection.close();
    });
}
```

Real example:

```js
var pg = require("pg");
// Uncomment if pg has not been properly promisified yet
//var Promise = require("bluebird");
//Promise.promisifyAll(pg, {
//    filter: function(methodName) {
//        return methodName === "connect"
//    },
//    multiArgs: true
//});
// Promisify rest of pg normally
//Promise.promisifyAll(pg);

function getSqlConnection(connectionString) {
    var close;
    return pg.connectAsync(connectionString).spread(function(client, done) {
        close = done;
        return client;
    }).disposer(function() {
        if (close) close();
    });
}

module.exports = getSqlConnection;
```

Real example 2:

```js
var mysql = require("mysql");
// Uncomment if pg has not been properly promisified yet
// var Promise = require("bluebird");
// Promise.promisifyAll(mysql);
// Promise.promisifyAll(require("mysql/lib/Connection").prototype);
// Promise.promisifyAll(require("mysql/lib/Pool").prototype);
var pool  = mysql.createPool({
    connectionLimit: 10,
    host: 'example.org',
    user: 'bob',
    password: 'secret'
});

function getSqlConnection() {
    return pool.getConnectionAsync().disposer(function(connection) {
        connection.release();
    });
}

module.exports = getSqlConnection;
```

The second argument passed to a disposer is the result promise of the using block, which you can inspect synchronously.

Example:

```js
function getTransaction() {
    return db.getTransactionAsync().disposer(function(tx, promise) {
        return promise.isFulfilled() ? tx.commitAsync() : tx.rollbackAsync();
    });
}


// If the using block completes successfully, the transaction is automatically committed
// Any error or rejection will automatically roll it back
using(getTransaction(), function(tx) {
    return tx.queryAsync(...).then(function() {
        return tx.queryAsync(...)
    }).then(function() {
        return tx.queryAsync(...)
    });
});
```

Real example 3, transactions with postgres:

```js
var pg = require('pg');
// uncomment if necessary
//var Promise = require("bluebird");
//Promise.promisifyAll(pg, {
//    filter: function(methodName) {
//        return methodName === "connect"
//    },
//    multiArgs: true
//});
// Promisify rest of pg normally
//Promise.promisifyAll(pg);

function getTransaction(connectionString) {
    var close;
    return pg.connectAsync(connectionString).spread(function(client, done) {
        close = done;
        return client.queryAsync('BEGIN').then(function () {
            return client;
        });
    }).disposer(function(client, promise) {
        if (promise.isFulfilled()) {
            return client.queryAsync('COMMIT').then(closeClient);
        } else {
            return client.queryAsync('ROLLBACK').then(closeClient);
        }
        function closeClient() {
            if (close) close(client);
        }
    });
}

exports.getTransaction = getTransaction;
```

#### Note about disposers in node

If a disposer method throws, its highly likely that it failed to dispose of the resource. In that case, Bluebird has two options - it can either ignore the error and continue with program execution or throw an exception (crashing the process in node.js). Bluebird prefers to do the later because resources are typically scarce. For example, if database connections cannot be disposed of and Bluebird ignores that, the connection pool will be quickly depleted and the process will become unusable. Since Bluebird doesn't know how to handle that, the only sensible default is to crash the process.

If you anticipate thrown errors while disposing of the resource you should use a `try..catch` block (or `Promise.try`) and write the appropriate code to handle the errors.

<hr>

</markdown></div>

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

<div class="api-code-section"><markdown>

##Promise.promisify

```js
Promise.promisify(
    function(any arguments..., function callback) nodeFunction,
    [Object {
        multiArgs: boolean=false,
        context: any=this
    } options]
) -> function
```

Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.

If the `nodeFunction` calls its callback with multiple success values, the fulfillment value will be an array of them.

Setting `multiArgs` to `true` means the resulting promise will always fulfill with an array of the callback's success value(s). This is needed because promises only support a single success value while some callback API's have multiple success value. The default is to ignore all but the first success value of a callback function.

If you pass a `receiver`, the `nodeFunction` will be called as a method on the `receiver`.

Example of promisifying the asynchronous `readFile` of node.js `fs`-module:

```js
var readFile = Promise.promisify(require("fs").readFile);

readFile("myfile.js", "utf8").then(function(contents) {
    return eval(contents);
}).then(function(result) {
    console.log("The result of evaluating myfile.js", result);
}).catch(SyntaxError, function(e) {
    console.log("File had syntax error", e);
//Catch any other error
}).catch(function(e) {
    console.log("Error reading file", e);
});
```

Note that if the node function is a method of some object, you can pass the object as the second argument like so:

```js
var redisGet = Promise.promisify(redisClient.get, {context: redisClient});
redisGet('foo').then(function() {
    //...
});
```

But this will also work:

```js
var getAsync = Promise.promisify(redisClient.get);
getAsync.call(redisClient, 'foo').then(function() {
    //...
});
```
<hr>

##Promise.promisifyAll

```js
Promise.promisifyAll(
    Object target,
    [Object {
        suffix: String="Async",
        multiArgs: boolean=false,
        filter: boolean function(String name, function func, Object target, boolean passesDefaultFilter),
        promisifier: function(function originalFunction, function defaultPromisifier)
    } options]
) -> Object
```

Promisifies the entire object by going through the object's properties and creating an async equivalent of each function on the object and its prototype chain. The promisified method name will be the original method name suffixed with `suffix` (default is `"Async"`). Any class properties of the object (which is the case for the main export of many modules) are also promisified, both static and instance methods. Class property is a property with a function value that has a non-empty `.prototype` object. Returns the input object.

Note that the original methods on the object are not overwritten but new methods are created with the `Async`-suffix. For example, if you `promisifyAll` the node.js `fs` object use `fs.statAsync` to call the promisified `stat` method.

Example:

```js
Promise.promisifyAll(require("redis"));

//Later on, all redis client instances have promise returning functions:

redisClient.hexistsAsync("myhash", "field").then(function(v) {

}).catch(function(e) {

});
```

It also works on singletons or specific instances:

```js
var fs = Promise.promisifyAll(require("fs"));

fs.readFileAsync("myfile.js", "utf8").then(function(contents) {
    console.log(contents);
}).catch(function(e) {
    console.error(e.stack);
});
```

See [promisification](#promisification) for more examples.

The entire prototype chain of the object is promisified on the object. Only enumerable are considered. If the object already has a promisified version of the method, it will be skipped. The target methods are assumed to conform to node.js callback convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument. If the node method calls its callback with multiple success values, the fulfillment value will be an array of them.

If a method name already has an `"Async"`-suffix, it will be duplicated. E.g. `getAsync`'s promisified name is `getAsyncAsync`.

####Option: suffix

Optionally, you can define a custom suffix through the options object:

```js
var fs = Promise.promisifyAll(require("fs"), {suffix: "MySuffix"});
fs.readFileMySuffix(...).then(...);
```

All the above limitations apply to custom suffices:

- Choose the suffix carefully, it must not collide with anything
- PascalCase the suffix
- The suffix must be a valid JavaScript identifier using ASCII letters
- Always use the same suffix everywhere in your application, you could create a wrapper to make this easier:

```js
module.exports = function myPromisifyAll(target) {
    return Promise.promisifyAll(target, {suffix: "MySuffix"});
};
```

####Option: multiArgs

Setting `multiArgs` to `true` means the resulting promise will always fulfill with an array of the callback's success value(s). This is needed because promises only support a single success value while some callback API's have multiple success value. The default is to ignore all but the first success value of a callback function.

####Option: filter

Optionally, you can define a custom filter through the options object:

```js
Promise.promisifyAll(..., {
    filter: function(name, func, target, passesDefaultFilter) {
        // name = the property name to be promisified without suffix
        // func = the function
        // target = the target object where the promisified func will be put with name + suffix
        // passesDefaultFilter = whether the default filter would be passed
        // return boolean (return value is coerced, so not returning anything is same as returning false)

        return passesDefaultFilter && ...
    }
})
```

The default filter function will ignore properties that start with a leading underscore, properties that are not valid JavaScript identifiers and constructor functions (function which have enumerable properties in their `.prototype`).


####Option: promisifier

Optionally, you can define a custom promisifier, so you could promisifyAll e.g. the chrome APIs used in Chrome extensions.

The promisifier gets a reference to the original method and should return a function which returns a promise.

```js
function DOMPromisifier(originalMethod) {
    // return a function
    return function promisified() {
        var args = [].slice.call(arguments);
        // Needed so that the original method can be called with the correct receiver
        var self = this;
        // which returns a promise
        return new Promise(function(resolve, reject) {
            args.push(resolve, reject);
            originalMethod.apply(self, args);
        });
    };
}

// Promisify e.g. chrome.browserAction
Promise.promisifyAll(chrome.browserAction, {promisifier: DOMPromisifier});

// Later
chrome.browserAction.getTitleAsync({tabId: 1})
    .then(function(result) {

    });
```

Combining `filter` with `promisifier` for the restler module to promisify event emitter:

```js
var Promise = require("bluebird");
var restler = require("restler");
var methodNamesToPromisify = "get post put del head patch json postJson putJson".split(" ");

function EventEmitterPromisifier(originalMethod) {
    // return a function
    return function promisified() {
        var args = [].slice.call(arguments);
        // Needed so that the original method can be called with the correct receiver
        var self = this;
        // which returns a promise
        return new Promise(function(resolve, reject) {
            // We call the originalMethod here because if it throws,
            // it will reject the returned promise with the thrown error
            var emitter = originalMethod.apply(self, args);

            emitter
                .on("success", function(data, response) {
                    resolve([data, response]);
                })
                .on("fail", function(data, response) {
                    // Erroneous response like 400
                    resolve([data, response]);
                })
                .on("error", function(err) {
                    reject(err);
                })
                .on("abort", function() {
                    reject(new Promise.CancellationError());
                })
                .on("timeout", function() {
                    reject(new Promise.TimeoutError());
                });
        });
    };
};

Promise.promisifyAll(restler, {
    filter: function(name) {
        return methodNamesToPromisify.indexOf(name) > -1;
    },
    promisifier: EventEmitterPromisifier
});

// ...

// Later in some other file

var restler = require("restler");
restler.getAsync("http://...", ...,).spread(function(data, response) {

})
```

Using `defaultPromisifier` parameter to add enhancements on top of normal node
promisification:

```js
var fs = Promise.promisifyAll(require("fs"), {
    promisifier: function(originalFunction, defaultPromisifer) {
        var promisified = defaultPromisifier(originalFunction);

        return function() {
            // Enhance normal promisification by supporting promises as
            // arguments

            var args = [].slice.call(arguments);
            var self = this;
            return Promise.all(args).then(function(awaitedArgs) {
                return promisified.apply(self, awaitedArgs);
            });
        };
    }
});

// All promisified fs functions now await their arguments if they are promises
var version = fs.readFileAsync("package.json", "utf8").then(JSON.parse).get("version");
fs.writeFileAsync("the-version.txt", version, "utf8");
```
<hr>

##Promise.fromCallback

```js
Promise.fromCallback(
    function(function callback) resolver,
    [Object {multiArgs: boolean=false} options]
) -> Promise
```
```js
Promise.fromNode(
    function(function callback) resolver,
    [Object {multiArgs: boolean=false} options]
) -> Promise
```

Returns a promise that is resolved by a node style callback function. This is the most fitting way to do on the fly promisification when libraries don't expose classes for automatic promisification by undefined.

The resolver function is passed a callback that expects to be called back according to error-first node conventions.

Setting `multiArgs` to `true` means the resulting promise will always fulfill with an array of the callback's success value(s). This is needed because promises only support a single success value while
some callback API's have multiple success value. The default is to ignore all but the first success value of a callback function.

Using manual resolver:

```js
var Promise = require("bluebird");
// "email-templates" doesn't expose prototypes for promisification
var emailTemplates = Promise.promisify(require('email-templates'));
var templatesDir = path.join(__dirname, 'templates');


emailTemplates(templatesDir).then(function(template) {
    return Promise.fromCallback(function(callback) {
        return template("newsletter", callback);
    }, true).spread(function(html, text) {
        console.log(html, text);
    });
});
```

The same can also be written more concisely with `Function.prototype.bind`:

```js
var Promise = require("bluebird");
// "email-templates" doesn't expose prototypes for promisification
var emailTemplates = Promise.promisify(require('email-templates'));
var templatesDir = path.join(__dirname, 'templates');


emailTemplates(templatesDir).then(function(template) {
    return Promise.fromCallback(template.bind(null, "newsletter"), true)
        .spread(function(html, text) {
            console.log(html, text);
        });
});
```

<hr>

##.asCallback


```js
.asCallback(
    [function(any error, any value) callback],
    [Object {spread: boolean=false} options]
) -> this
```
```js
.nodeify(
    [function(any error, any value) callback],
    [Object {spread: boolean=false} options]
) -> this
```

Register a node-style callback on this promise. When this promise is either fulfilled or rejected, the node callback will be called back with the node.js convention where error reason is the first argument and success value is the second argument. The error argument will be `null` in case of success.

Returns back this promise instead of creating a new one. If the `callback` argument is not a function, this method does not do anything.

This can be used to create APIs that both accept node-style callbacks and return promises:

```js
function getDataFor(input, callback) {
    return dataFromDataBase(input).asCallback(callback);
}
```

The above function can then make everyone happy.

Promises:

```js
getDataFor("me").then(function(dataForMe) {
    console.log(dataForMe);
});
```

Normal callbacks:

```js
getDataFor("me", function(err, dataForMe) {
    if( err ) {
        console.error( err );
    }
    console.log(dataForMe);
});
```

Promises can be rejected with falsy values (or no value at all, equal to rejecting with `undefined`), however `.asCallback` will call the callback with an `Error` object if the promise's rejection reason is a falsy value. You can retrieve the original falsy value from the error's `.cause` property.

Example:

```js
Promise.reject(null).asCallback(function(err, result) {
    // If is executed
    if (err) {
        // Logs 'null'
        console.log(err.cause);
    }
});
```

There is no effect on peformance if the user doesn't actually pass a node-style callback function.

####Option: spread

Some nodebacks expect more than 1 success value but there is no mapping for this in the promise world. You may specify the option `spread` to call the nodeback with multiple values when the fulfillment value is an array:

```js
Promise.resolve([1,2,3]).asCallback(function(err, result) {
    // err == null
    // result is the array [1,2,3]
});

Promise.resolve([1,2,3]).asCallback(function(err, a, b, c) {
    // err == null
    // a == 1
    // b == 2
    // c == 3
}, {spread: true});

Promise.resolve(123).asCallback(function(err, a, b, c) {
    // err == null
    // a == 123
    // b == undefined
    // c == undefined
}, {spread: true});
```

<hr>

</markdown></div>

##Timers

Methods to delay and time promises out.

<div class="api-code-section"><markdown>

<hr>

##.timeout

```js
.timeout(
    int ms,
    [String message="operation timed out"]
) -> CancellablePromise
```


Returns a undefined promise that will be fulfilled with this promise's fulfillment value or rejection reason. However, if this promise is not fulfilled or rejected within `ms` milliseconds, the returned promise is cancelled with a [`TimeoutError`](.) as the cancellation reason.

You may specify a custom error message with the `message` parameter.

The example function `fetchContent` doesn't leave the ongoing http request in the background in case the request cancelled from outside, either manually or through a timeout.

```js
// Assumes TimeoutError and CancellationError are both globally available
function fetchContent() {
    var jqXHR = $.get("http://www.slowpage.com");
    // Resolve the jQuery promise into a bluebird promise
    return Promise.resolve(jqXHR)
        .cancellable()
        .catch(TimeoutError, CancellationError, function(e) {
            jqXHR.abort();
            // Don't swallow it
            throw e;
        })
}

function fetchContentWith5Retries(retries) {
    retries = retries || 0;
    return fetchContent()
        .then(function(result) {
            //..
        })
        .timeout(100)
        .catch(TimeoutError, function(e) {
            if (retries < 5) {
                return fetchContentWith5Retries(retries + 1);
            }
            else {
                throw new Error("couldn't fetch content after 5 timeouts");
            }
        })
```

<hr>

##.delay

```js
.delay(int ms) -> Promise
```

Same as calling [Promise.delay(this, ms)](.).

##Promise.delay

```js
Promise.delay(
    [any|Promise<any> value=undefined],
    int ms
) -> Promise
```


Returns a promise that will be resolved with `value` (or `undefined`) after given `ms` milliseconds. If `value` is a promise, the delay will start counting down when it is fulfilled and the returned promise will be fulfilled with the fulfillment value of the `value` promise.

```js
Promise.delay(500).then(function() {
    console.log("500 ms passed");
    return "Hello world";
}).delay(500).then(function(helloWorldString) {
    console.log(helloWorldString);
    console.log("another 500 ms passed") ;
});
```

<hr>

</markdown></div>

##Cancellation

By default, a promise is not cancellable. A promise can be marked as cancellable with [`.cancellable`](.). A cancellable promise can be cancelled if it's not resolved. Cancelling a promise propagates to the farthest cancellable ancestor of the target promise that is still pending, and rejects that promise with the given reason, or [`CancellationError`](.) by default. The rejection will then propagate back to the original promise and to its descendants. This roughly follows the semantics described [here](https://github.com/promises-aplus/cancellation-spec/issues/7).

Promises marked with [`.cancellable`](.) return cancellable promises automatically.

If you are the resolver for a promise, you can react to a cancel in your promise by catching the [`CancellationError`](.):

```js
function ajaxGetAsync(url) {
    var xhr = new XMLHttpRequest;
    return new Promise(function (resolve, reject) {
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).cancellable().catch(Promise.CancellationError, function(e) {
        xhr.abort();
        throw e; //Don't swallow it
    });
}
```

<hr>

<div class="api-code-section"><markdown>

##.cancellable

```js
.cancellable() -> CancellablePromise
```


Marks this promise as cancellable. Promises by default are not cancellable after v0.11 and must be marked as such for [`.cancel`](.) to have any effect. Marking a promise as cancellable is infectious and you don't need to remark any descendant promise.

If you have code written prior v0.11 using cancellation, add calls to [`.cancellable`](.) at the starts of promise chains that need to support
cancellation in themselves or somewhere in their descendants.

<hr>

##.uncancellable

```js
.uncancellable() -> Promise
```


Create an uncancellable promise based on this promise.

<hr>

##.cancel

```js
.cancel([Error reason=new CancellationError()]) -> undefined
```


Cancel this promise with the given reason. The cancellation will propagate
to farthest cancellable ancestor promise which is still pending.

That ancestor will then be rejected with the given `reason`, or a [`CancellationError`](.) if it is not given. (get a reference from `Promise.CancellationError`) object as the rejection reason.

Promises are by default not cancellable. Use [`.cancellable`](.) to mark a promise as cancellable.

<hr>

##.isCancellable

```js
.isCancellable() -> boolean
```


See if this promise can be cancelled.

<hr>

</markdown></div>
##Generators

Using ECMAScript6 generators feature to implement C# 5.0 `async/await` like syntax.

<div class="api-code-section"><markdown>

##Promise.coroutine

```js
Promise.coroutine(GeneratorFunction(...arguments) generatorFunction) -> function
```

Returns a function that can use `yield` to yield promises. Control is returned back to the generator when the yielded promise settles. This can lead to less verbose code when doing lots of sequential async calls with minimal processing in between. Requires node.js 0.12+, io.js 1.0+ or Google Chrome 40+.

```js
var Promise = require("bluebird");

function PingPong() {

}

PingPong.prototype.ping = Promise.coroutine(function* (val) {
    console.log("Ping?", val)
    yield Promise.delay(500)
    this.pong(val+1)
});

PingPong.prototype.pong = Promise.coroutine(function* (val) {
    console.log("Pong!", val)
    yield Promise.delay(500);
    this.ping(val+1)
});

var a = new PingPong();
a.ping(0);
```

Running the example:

    $ node test.js
    Ping? 0
    Pong! 1
    Ping? 2
    Pong! 3
    Ping? 4
    Pong! 5
    Ping? 6
    Pong! 7
    Ping? 8
    ...

When called, the coroutine function will start an instance of the generator and returns a promise for its final value.

Doing `Promise.coroutine` is almost like using the C# `async` keyword to mark the function, with `yield` working as the `await` keyword. Promises are somewhat like `Task`s.

**Tip**

You are able to yield non-promise values by adding your own yield handler using  [`Promise.coroutine.addYieldHandler`](.)

<hr>

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
        var def = Promise.defer();
        try { v(def.callback); } catch(e) { def.reject(e); }
        return def.promise;
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
   var promises = [];

   fileNames.forEach(function (fileName) {
      promises.push(fs.readFileAsync(fileName, "utf8"));
   });

   return yield promises;
});
```

</markdown></div>

##Utility

Functions that could potentially be handy in some situations.

<hr>

<div class="api-code-section"><markdown>

##.tap

```js
.tap(function(any value) handler) -> Promise
```


Like [`.finally`](.) that is not called for rejections.

```js
getUser().tap(function(user) {
    //Like in finally, if you return a promise from the handler
    //the promise is awaited for before passing the original value through
    return recordStatsAsync();
}).then(function(user) {
    //user is the user from getUser(), not recordStatsAsync()
});
```

Common case includes adding logging to an existing promise chain:

```js
doSomething()
    .then(...)
    .then(...)
    .then(...)
    .then(...)
```

```js
doSomething()
    .then(...)
    .then(...)
    .tap(console.log)
    .then(...)
    .then(...)
```

*Note: in browsers it is necessary to call `.tap` with `console.log.bind(console)` because console methods can not be called as stand-alone functions.*

<hr>

##.call

```js
.call(
    String methodName,
    [any args...]
)
```

This is a convenience method for doing:

```js
promise.then(function(obj) {
    return obj[methodName].call(obj, arg...);
});
```

For example ([`some` is a built-in array method](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some)):

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");
var thisPath = process.argv[2] || ".";
var now = Date.now();

fs.readdirAsync(thisPath)
    .map(function(fileName) {
        return fs.statAsync(path.join(thisPath, fileName));
    })
    .call("some", function(stat) {
        return (now - new Date(stat.mtime)) < 10000;
    })
    .then(function(someFilesHaveBeenModifiedLessThanTenSecondsAgo) {
        console.log(someFilesHaveBeenModifiedLessThanTenSecondsAgo) ;
    });
```

Chaining lo-dash or underscore methods (Copy-pasteable example):

```js
var Promise = require("bluebird");
var pmap = Promise.map;
var props = Promise.props;
var _ = require("lodash");
var fs = Promise.promisifyAll(require("fs"));

function getTotalSize(paths) {
    return pmap(paths, function(path) {
        return fs.statAsync(path).get("size");
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
}

fs.readdirAsync(".").then(_)
    .call("groupBy", function(fileName) {
        return fileName.charAt(0);
    })
    .call("map", function(fileNames, firstCh) {
        return props({
            firstCh: firstCh,
            count: fileNames.length,
            totalSize: getTotalSize(fileNames)
        });
    })
    // Since the currently wrapped array contains promises we need to unwrap it and call .all() before continuing the chain
    // If the currently wrapped thing was an object with properties that might be promises, we would call .props() instead
    .call("value").all().then(_)
    .call("sortBy", "count")
    .call("reverse")
    .call("map", function(data) {
        return data.count + " total files beginning with " + data.firstCh + " with total size of " + data.totalSize + " bytes";
    })
    .call("join", "\n")
    .then(console.log)
```

<hr>

##.get

```js
.get(String propertyName|int index) -> Promise
```


This is a convenience method for doing:

```js
promise.then(function(obj) {
    return obj[propertyName];
});
```

For example:

```js
db.query("...")
    .get(0)
    .then(function(firstRow) {

    });
```

If `index` is negative, the indexed load will become `obj.length + index`. So that -1 can be used to read last item
in the array, -2 to read the second last and so on. For example:

```js
Promise.resolve([1,2,3]).get(-1).then(function(value) {
    console.log(value); // 3
});
```

If the `index` is still negative after `obj.length + index`, it will be clamped to 0.

<hr>

##.return

```js
.return(any value) -> Promise
```
```js
.thenReturn(any value) -> Promise
```

Convenience method for:

```js
.then(function() {
   return value;
});
```

in the case where `value` doesn't change its value because its binding time is different than when using a closure.

That means `value` is bound at the time of calling [`.return`](.) so this will not work as expected:

```js
function getData() {
    var data;

    return query().then(function(result) {
        data = result;
    }).return(data);
}
```

because `data` is `undefined` at the time `.return` is called.

Function that returns the full path of the written file:

```js
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var baseDir = process.argv[2] || ".";

function writeFile(path, contents) {
    var fullpath = require("path").join(baseDir, path);
    return fs.writeFileAsync(fullpath, contents).thenReturn(fullpath);
}

writeFile("test.txt", "this is text").then(function(fullPath) {
    console.log("Successfully file at: " + fullPath);
});
```

*For compatibility with earlier ECMAScript version, an alias `.thenReturn` is provided for [`.return`](.).*

<hr>

##.throw

```js
.throw(any reason) -> Promise
```
```js
.thenThrow(any reason) -> Promise
```


Convenience method for:

```js
.then(function() {
   throw reason;
});
```

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).

*For compatibility with earlier ECMAScript version, an alias `.thenThrow` is provided for [`.throw`](.).*

<hr>

##.catchReturn

```js
.catchReturn(
    [class ErrorClass|function(any error) predicate],
    any value
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   return value;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `value` to apply as with [`.return`](.).

<hr>

##.catchThrow

```js
.catchThrow(
    [class ErrorClass|function(any error) predicate],
    any reason
) -> Promise
```

Convenience method for:

```js
.catch(function() {
   throw reason;
});
```
You may optionally prepend one predicate function or ErrorClass to pattern match the error (the generic [.catch](.) methods accepts multiple)

Same limitations regarding to the binding time of `reason` to apply as with [`.return`](.).

<hr>

##.reflect

```js
.reflect() -> Promise<PromiseInspection>
```


The [`.reflect`](.) method returns a promise that is always successful when this promise is settled. Its fulfillment value is an object that implements the [PromiseInspection](.) interface and reflects the resolution this promise.

Using `.reflect()` to implement `settleAll` (wait until all promises in an array are either rejected or fulfilled) functionality

```js
var promises = [getPromise(), getPromise(), getPromise()];
Promise.all(promises.map(function(promise) {
    return promise.reflect();
})).each(function(inspection) {
    if (inspection.isFulfilled()) {
        console.log("A promise in the array was fulfilled with", inspection.value());
    } else {
        console.error("A promise in the array was rejected with", inspection.reason());
    }
});
```

Using `.reflect()` to implement `settleProps` (like settleAll for an object's properties) functionality

```js
var object = {
    first: getPromise1(),
    second: getPromise2()
};
Promise.props(Object.keys(object).reduce(function(newObject, key) {
    newObject[key] = object[key].reflect();
    return newObject;
}, {})).then(function(object) {
    if (object.first.isFulfilled()) {
        console.log("first was fulfilled with", object.first.value());
    } else {
        console.error("first was rejected with", object.first.reason());
    }
})
```

<hr>

##Promise.noConflict

```js
Promise.noConflict() -> Object
```


This is relevant to browser environments with no module loader.

Release control of the `Promise` namespace to whatever it was before this library was loaded. Returns a reference to the library namespace so you can attach it to something else.

```html
<!-- the other promise library must be loaded first -->
<script type="text/javascript" src="/scripts/other_promise.js"></script>
<script type="text/javascript" src="/scripts/bluebird_debug.js"></script>
<script type="text/javascript">
//Release control right after
var Bluebird = Promise.noConflict();

//Cast a promise from some other Promise library using the Promise namespace to Bluebird:
var promise = Bluebird.resolve(new Promise());
</script>
```

<hr>

##Promise.setScheduler

```js
Promise.setScheduler(function(function fn) scheduler) -> undefined
```


Scheduler should be a function that asynchronously schedules the calling of the passed in function:

```js
// This is just an example of how to use the api, there is no reason to do this
Promise.setScheduler(function(fn) {
    setTimeout(fn, 0);
});
```

Setting a custom scheduler could be necessary when you need a faster way to schedule functions than bluebird does by default.

You can also use it as a hook:

```js
// This will synchronize bluebird promise queue flushing with angulars queue flushing
// Angular is also now responsible for choosing the actual scheduler
Promise.setScheduler(function(fn) {
    $rootScope.$evalAsync(fn);
});
```



</markdown></div>

##Built-in error types

Bluebird includes a few built-in error types for common usage. All error types have the same identity across different copies of bluebird
module so that pattern matching works in [`.catch`](.). All error types have a constructor taking a message string as their first argument, with that message
becoming the `.message` property of the error object.

By default the error types need to be referenced from the Promise constructor, e.g. to get a reference to [TimeoutError](.), do `var TimeoutError = Promise.TimeoutError`. However, for convenience you will probably want to just make the references global.

<div class="api-code-section"><markdown>

##OperationalError

```js
new OperationalError(String message) -> OperationalError
```


Represents an error is an explicit promise rejection as opposed to a thrown error. For example, if an error is errbacked by a callback API promisified through undefined or undefined
and is not a typed error, it will be converted to a `OperationalError` which has the original error in the `.cause` property.

`OperationalError`s are caught in [`.error`](.) handlers.

<hr>

##TimeoutError

```js
new TimeoutError(String message) -> TimeoutError
```


Signals that an operation has timed out. Used as a custom cancellation reason in [`.timeout`](.).

<hr>

##CancellationError

```js
new CancellationError(String message) -> CancellationError
```


Signals that an operation has been aborted or cancelled. The default reason used by [`.cancel`](.).

<hr>

##AggregateError

```js
new AggregateError() extends Array -> AggregateError
```


A collection of errors. `AggregateError` is an array-like object, with numeric indices and a `.length` property. It supports all generic array methods such as `.forEach` directly.

`AggregateError`s are caught in [`.error`](.) handlers, even if the contained errors are not operational.

[Promise.some](.) and [Promise.any](.)  use `AggregateError` as rejection reason when they fail.


Example:

```js
//Assumes AggregateError has been made global
var err = new AggregateError();
err.push(new Error("first error"));
err.push(new Error("second error"));
throw err;
```

<hr>
</markdown></div>

##Error management configuration

The default approach of bluebird is to immediately log the stack trace when there is an unhandled rejection. This is similar to how uncaught exceptions cause the stack trace to be logged so that you have something to work with when something is not working as expected.

However because it is possible to handle a rejected promise at any time in the indeterminate future, some programming patterns will result in false positives. Because such programming patterns are not necessary and can always be refactored to never cause false positives, we recommend doing that to keep debugging as easy as possible . You may however feel differently so bluebird provides hooks to implement more complex failure policies.

Such policies could include:

- Logging after the promise became GCd (requires a native node.js module)
- Showing a live list of rejected promises
- Using no hooks and using [`.done`](.) to manually to mark end points where rejections will not be handled
- Swallowing all errors (challenge your debugging skills)
- ...

<hr>

###Global rejection events

Starting from 2.7.0 all bluebird instances also fire rejection events globally so that applications can register one universal hook for them.

The global events are:

 - `"unhandledRejection"` (corresponds to the local [`Promise.onPossiblyUnhandledRejection`](.))
 - `"rejectionHandled"` (corresponds to the local [`Promise.onUnhandledRejectionHandled`](.))


Attaching global rejection event handlers in **node.js**:

```js
// NOTE: event name is camelCase as per node convention
process.on("unhandledRejection", function(reason, promise) {
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
});

// NOTE: event name is camelCase as per node convention
process.on("rejectionHandled", function(promise) {
    // See Promise.onUnhandledRejectionHandled for parameter documentation
});
```

Attaching global rejection event handlers in **browsers**:

Using DOM3 `addEventListener` APIs (support starting from IE9+):

```js
// NOTE: event name is all lower case as per DOM convention
window.addEventListener("unhandledrejection", function(e) {
    // NOTE: e.preventDefault() must be manually called to prevent the default
    // action which is currently to log the stack trace to console.warn
    e.preventDefault();
    // NOTE: parameters are properties of the event detail property
    var reason = e.detail.reason;
    var promise = e.detail.promise;
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
});

// NOTE: event name is all lower case as per DOM convention
window.addEventListener("rejectionhandled", function(e) {
    // NOTE: e.preventDefault() must be manually called prevent the default
    // action which is currently unset (but might be set to something in the future)
    e.preventDefault();
    // NOTE: parameters are properties of the event detail property
    var promise = e.detail.promise;
    // See Promise.onUnhandledRejectionHandled for parameter documentation
});
```

In Web Workers you may use `self.addEventListener`.

Using legacy APIs (support starting from IE6+):

```js
// NOTE: event name is all lower case as per legacy convention
window.onunhandledrejection = function(reason, promise) {
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
};

// NOTE: event name is all lower case as per legacy convention
window.onrejectionhandled = function(promise) {
    // See Promise.onUnhandledRejectionHandled for parameter documentation
};
```
<hr>

<div class="api-code-section"><markdown>

##Promise.onPossiblyUnhandledRejection

```js
Promise.onPossiblyUnhandledRejection(function(any error, Promise promise) handler) -> undefined
```


*Note: this hook is specific to the bluebird instance its called on, application developers should use [global rejection events](#global-rejection-events)*

Add `handler` as the handler to call when there is a possibly unhandled rejection. The default handler logs the error stack to stderr or `console.error` in browsers.

```js
Promise.onPossiblyUnhandledRejection(function(e, promise) {
    throw e;
});
```

Passing no value or a non-function will have the effect of removing any kind of handling for possibly unhandled rejections.

<hr>

##Promise.onUnhandledRejectionHandled

```js
Promise.onUnhandledRejectionHandled(function(Promise promise) handler) -> undefined
```


*Note: this hook is specific to the bluebird instance its called on, application developers should use [global rejection events](#global-rejection-events)*

Add `handler` as the handler to call when a rejected promise that was reported as "possibly unhandled rejection" became handled.

Together with `onPossiblyUnhandledRejection` these hooks can be used to implement a debugger that will show a list
of unhandled promise rejections updated in real time as promises become handled.

For example:

```js
var unhandledPromises = [];
Promise.onPossiblyUnhandledRejection(function(reason, promise) {
    unhandledPromises.push(promise);
    //Update some debugger UI
});

Promise.onUnhandledRejectionHandled(function(promise) {
    var index = unhandledPromises.indexOf(promise);
    unhandledPromises.splice(index, 1);
    //Update the debugger UI
});
```

<hr>

##Promise.longStackTraces

```js
Promise.longStackTraces() -> undefined
```


Call this right after the library is loaded to enabled long stack traces. Long stack traces cannot be disabled after being enabled, and cannot be enabled after promises have alread been created. Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.

Long stack traces are enabled by default in the debug build.

To enable them in all instances of bluebird in node.js, use the environment variable `BLUEBIRD_DEBUG`:

```
BLUEBIRD_DEBUG=1 node server.js
```

Setting the environment variable `NODE_ENV` to `"development"` also automatically enables long stack traces.

You should enabled long stack traces if you want better debugging experience. For example:

```js
Promise.longStackTraces();
Promise.resolve().then(function outer() {
    return Promise.resolve().then(function inner() {
        return Promise.resolve().then(function evenMoreInner() {
            a.b.c.d()
        }).catch(function catcher(e) {
            console.error(e.stack);
        });
    });
});
```

Gives

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:6:13)
    From previous event:
        at inner (<anonymous>:5:24)
    From previous event:
        at outer (<anonymous>:4:20)
    From previous event:
        at <anonymous>:3:9
        at Object.InjectedScript._evaluateOn (<anonymous>:581:39)
        at Object.InjectedScript._evaluateAndWrap (<anonymous>:540:52)
        at Object.InjectedScript.evaluate (<anonymous>:459:21)

While with long stack traces disabled, you would get:

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:6:13)
        at tryCatch1 (<anonymous>:41:19)
        at Promise$_resolvePromise [as _resolvePromise] (<anonymous>:1739:13)
        at Promise$_resolveLast [as _resolveLast] (<anonymous>:1520:14)
        at Async$_consumeFunctionBuffer [as _consumeFunctionBuffer] (<anonymous>:560:33)
        at Async$consumeFunctionBuffer (<anonymous>:515:14)
        at MutationObserver.Promise$_Deferred (<anonymous>:433:17)

On client side, long stack traces currently only work in recent Firefoxes, Chrome and Internet Explorer 10+.

<hr>

##Promise.config

```js
Promise.config(Object {
    warnings: boolean=false,
    longStackTraces: boolean=false
} options) -> undefined;
```

Configure long stack traces and warnings.

```js
Promise.config({
    warnings: true,
    longStackTraces: true
});
```

<hr>

##.suppressUnhandledRejections

```js
.suppressUnhandledRejections() -> undefined
```

Basically sugar for doing:

```js
somePromise.catch(function(){});
```

Which is needed in case error handlers are attached asynchronously to the promise later, which would otherwise result in premature unhandled rejection reporting.

Example:

```js
var tweets = fetchTweets();
$(document).on("ready", function() {
    tweets.then(function() {
        // Render tweets
    }).catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
});
```

If fetching tweets fails before the document is ready the rejection is reported as unhandled even though it will be eventually handled when the document is ready. This is of course impossible to determine automatically, but you can explicitly do so using `.suppressUnhandledRejections()`:

```js
var tweets = fetchTweets();
tweets.suppressUnhandledRejections();
$(document).on("ready", function() {
    tweets.then(function() {
        // Render tweets
    }).catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
});
```

It should be noted that there is no real need to attach the handlers asynchronously. Exactly the same effect can be achieved with:

```js
fetchTweets()
    .finally(function() {
        return $.ready.promise();
    })
    // DOM guaranteed to be ready after this point
    .then(function() {
        // Render tweets
    })
    .catch(function(e) {
        alert("failed to fetch tweets because: " + e);
    });
```

The advantage of using `.suppressUnhandledRejections()` over `.catch(function(){})` is that it doesn't increment the branch count of the promise. Branch counts matter when using cancellation because a promise will only be cancelled if all of its branches want to cancel it.

<hr>

##.done

```js
.done(
    [function(any value) fulfilledHandler],
    [function(any error) rejectedHandler]
) -> undefined
```


Like [`.then`](.), but any unhandled rejection that ends up here will crash the process (in node) or be thrown as an error (in browsers). The use of this method is heavily discouraged and it only exists for historical reasons.

<hr>

</markdown></div>

##Progression migration

Progression has been removed as there are composability and chaining issues with APIs that use promise progression handlers. Implementing the common use case of progress bars can be accomplished using a pattern similar to [IProgress](http://blogs.msdn.com/b/dotnet/archive/2012/06/06/async-in-4-5-enabling-progress-and-cancellation-in-async-apis.aspx) in C#.

For old code that still uses it, see [the progression docs in the deprecated API documentation](/bluebird/web/docs/deprecated_apis.html#progression).

Using jQuery before:

```js
Promise.resolve($.get(...))
    .progressed(function() {
        // ...
    })
    .then(function() {
        // ...
    })
    .catch(function(e) {
        // ...
    })
```

Using jQuery after:

```js
Promise.resolve($.get(...).progress(function() {
        // ...
    }))
    .then(function() {
        // ...
    })
    .catch(function(e) {
        // ...
    })
```

Implementing general progress interfaces like in C#:

```js
function returnsPromiseWithProgress(progressHandler) {
    return doFirstAction().tap(function() {
        progressHandler(0.33);
    }).then(doSecondAction).tap(function() {
        progressHandler(0.66);
    }).then(doThirdAction).tap(function() {
        progressHandler(1.00);
    });
}

returnsPromiseWithProgress(function(progress) {
    ui.progressbar.setWidth((progress * 200) + "px"); // update with on client side
}).then(function(value) { // action complete
   // entire chain is complete.
}).catch(function(e) {
    // error
});
```

Another example using `coroutine`:

```js
var doNothing = function() {};
var progressSupportingCoroutine = Promise.coroutine(function* (progress) {
        progress = typeof progress === "function" ? progress : doNothing;
        var first = yield getFirstValue();
        // 33% done
        progress(0.33);
        var second = yield getSecondValue();
        progress(0.67);
        var third = yield getThirdValue();
        progress(1);
        return [first, second, third];
});

var progressConsumingCoroutine = Promise.coroutine(function* () {
    var allValues = yield progressSupportingCoroutine(function(p) {
         ui.progressbar.setWidth((p * 200) + "px");
    });
    var second = allValues[1];
    // ...
});
```

##Deferred migration

Deferreds are deprecated in favor of the promise constructor. If you need deferreds for some reason, you can create them trivially using the constructor:

```js
function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}
```

For old code that still uses deferred objects, see [the deprecated API docs ](/bluebird/web/docs/deprecated_apis.html#promise-resolution).

##Environment variables

This section only applies to node.js or io.js.

You can change bluebird behavior globally with various environment variables. These global variables affect all instances of bluebird that are running in your environment, rather than just the one you have `require`d in your application. The effect an environment variable has depends on the bluebird version.

Environment variables supported by 2.x:

- `BLUEBIRD_DEBUG` - Set to any truthy value this will enable long stack traces and warnings
- `NODE_ENV` - If set exactly to `development` it will have the same effect as if the `BLUEBIRD_DEBUG` variable was set.

Environment variables supported by 3.x:

- `BLUEBIRD_DEBUG` - Set to any truthy value this will enable long stack traces and warnings, unless those are explicitly disabled
- `NODE_ENV` - If set exactly to `development` it will have the same effect as if the `BLUEBIRD_DEBUG` variable was set.
- `BLUEBIRD_WARNINGS` - if set exactly to `0` it will explicitly disable warnings and this overrides any other setting that might enable warnings. If set to any truthy value, it will explicitly enable warnings.
- `BLUEBIRD_LONG_STACK_TRACES` - if set exactly to `0` it will explicitly disable long stack traces and this overrides any other setting that might enable long stack traces. If set to any truthy value, it will explicitly enable long stack traces.
