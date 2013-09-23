#API Reference

- [Core](#core)
- [Promise resolution](#promise-resolution)
- [Collections](#collections)
- [Cancellation](#cancellation)
- [Synchronous inspection](#synchronous-inspection)
- [Utility](#utility)

##Core

Core methods of `Promise` instances and core static methods of the Promise class.

###`new Promise(Function<Function resolve, Function reject> resolver)` -> `Promise`

Create a new promise. The passed in function will receive functions `resolve` and `reject` as its arguments which can be called to seal the fate of the created promise.

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
    
###`.then([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])` -> `Promise`

[Promises/A+ `.then()`](http://promises-aplus.github.io/promises-spec/) with progress handler. Returns a new promise chained from this promise. The new promise will be rejected or resolved depending on the passed `fulfilledHandler`, `rejectedHandler` and the state of this promise.

Example:

```js
    promptAsync("Which url to visit?").then(function(url){
        return ajaxGetAsync(url);
    }).then(function(contents){
        alertAsync("The contents were: " + contents);
    }).catch(function(e){
        alertAsync("Exception " + e);
    });
```

###`.catch(Function handler)` -> `Promise`

This is a catch-all exception handler, shortcut for calling `.then(null, handler)` on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

For compatibility with earlier ECMAScript version, an alias `.caught()` is provided for `.catch()`.

###`.catch([Function ErrorClass...], Function handler])` -> `Promise`

This extends `.catch` to work more like catch-clauses in languages like Java or C#. Instead of manually checking `instanceof` or `.name === "SomeError"`, you may specify a number of error constructors which are eligible for this catch handler. The catch handler that is first met that has eligible constructors specified, is the one that will be called.

Example:

```js
    somePromise.then(function(){
        return a.b.c.d();
    }).catch(TypeError, function(e){
        //If a is defined, will end up here because 
        //it is a type error to reference property of undefined
    }).catch(ReferenceError, function(e){
        //Will end up here if a wasn't defined at all
    }).catch(function(e){
        //Generic catch-the rest, error wasn't TypeError nor
        //ReferenceError
    });
 ```
 
You may also add multiple filters for a catch handler:

```js
    somePromise.then(function(){
        return a.b.c.d();
    }).catch(TypeError, ReferenceError, function(e){
        //Will end up here on programmer error
    }).catch(NetworkError, TimeoutError, function(e){
        //Will end up here on expected everyday network errors
    }).catch(function(e){
        //Catch any unexpected errors
    });
```
    
For a paramater to be considered a type of error that you want to filter, you need the constructor to have its `.prototype` property be `instanceof Error`.

Such a constructor can be created like so:

```js
    function MyCustomError() {}
    MyCustomError.prototype = Object.create(Error.prototype);
```

Using it:

```js
    Promise.fulfilled().then(function(){
        throw new MyCustomError();
    }).catch(MyCustomError, function(e){
        //will end up here now
    });
```
    
For compatibility with earlier ECMAScript version, an alias `.caught()` is provided for `.catch()`.
        
###`.finally(Function handler)` -> `Promise`

Pass a handler that will be called regardless of this promise's fate. Returns a new promise chained from this promise. There are special semantics for `.finally()` in that the final value cannot be modified from the handler.

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
        }).finally(function(){
            $("#ajax-loader-animation").hide();
        });
    }
```

Now the animation is hidden but an exception or the actual return value will automatically skip the finally and propagate to further chainers. This is more in line with the synchronous `finally` keyword.

The `.finally` works like [Q's finally method](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback).
    
For compatibility with earlier ECMAScript version, an alias `.lastly()` is provided for `.finally()`.

###`.progressed(Function handler)` -> `Promise`

Shorthand for `.then(null, null, handler);`. Attach a progress handler that will be called if this promise is progressed. Returns a new promise chained from this promise.

###`Promise.fulfilled(dynamic value)` -> `Promise`

Create a promise that is fulfilled with the given `value`. If `value` is a trusted `Promise`, the promise will instead follow that promise, adapting to its state. The promise is synchronously fulfilled in the former case.

###`Promise.rejected(dynamic reason)` -> `Promise`

Create a promise that is rejected with the given `reason`. The promise is synchronously rejected.

###`Promise.pending()` -> `PromiseResolver`

Create a promise with undecided fate and return a `PromiseResolver` to control it. See [Promise resultion](#promise-resolution).

###`Promise.cast(dynamic value)` -> `Promise`

Cast the given `value` to a trusted promise. If `value` is already a trusted `Promise`, it is returned as is. If `value` is not a thenable, a fulfilled Promise is returned with `value` as its fulfillment value. If `value` is a thenable (Promise-like object, like those returned by jQuery's `$.ajax`), returns a trusted Promise that assimilates the state of the thenable.

Example: (`$` is jQuery)

```js
    Promise.cast($.get("http://www.google.com")).then(function(){
        //Returning a thenable from a handler is automatically
        //cast to a trusted Promise as per Promises/A+ specification
        return $.post("http://www.yahoo.com");
    }).then(function(){
    
    }).catch(function(e){
        //jQuery doesn't throw real errors so use catch-all
        console.log(e.statusText);
    });
```

###`Promise.is(dynamic value)` -> `boolean`

See if `value` is a trusted Promise.

```js
    Promise.is($.get("http://www.google.com")); //false
    Promise.is(Promise.cast($.get("http://www.google.com"))) //true
```

##Promise resolution

A `PromiseResolver` can be used to control the fate of a promise. It is like "Deferred" known in jQuery. The `PromiseResolver` objects have a `.promise` property which returns a reference to the controlled promise that can be passed to clients. `.promise` of a `PromiseResolver` is not a getter function to match other implementations.

The methods of a `PromiseResolver` have no effect if the fate of the underlying promise is already decided (follow, reject, fulfill).

###`.fulfill(dynamic value)` -> `undefined`

Fulfill the underlying promise with `value` as the fulfillment value. If `value` is a trusted `Promise`, the underlying promise will instead follow that promise, adapting to its state.

###`.reject(dynamic reason)` -> `undefined`

Reject the underlying promise with `reason` as the rejection reason.

###`.progress(dynamic value)` -> `undefined`

Progress the underlying promise with `value` as the progression value.

##Collections

Methods of `Promise` instances and core static methods of the Promise class to deal with
collections of promises or mixed promises and values.

###`.spread([Function fulfilledHandler] [, Function rejectedHandler ])` -> `Promise`

###`.map(Function mapper)` -> `Promise`

###`.any()` -> `Promise`

###`.settle()` -> `Promise`

###`.some(int count)` -> `Promise`

###`.reduce(Function reducer [, dynamic initialValue])` -> `Promise`

###`.all()` -> `Promise`

###`Promise.map(Array<dynamic> values, Function mapper)` -> `Promise`

###`Promise.any(Array<dynamic> values)` -> `Promise`

###`Promise.settle(Array<dynamic> values)` -> `Promise`

###`Promise.some(Array<dynamic> values, int count)` -> `Promise`

###`Promise.reduce(Array<dynamic> values, Function reducer [, dynamic initialValue])` -> `Promise`

###`Promise.all(Array<dynamic> values)` -> `Promise`

###`Promise.join([dynamic value...])` -> `Promise`


##Cancellation

By default, all Promises are cancellable. A cancellable promise can be cancelled if it's not resolved. Cancelling a promise propagates to the farthest ancestor of the target promise that is still pending, and rejects that promise with `CancellationError`. The rejection will then propagate back to the original promise and to its descendants. This roughly follows the semantics described [here](https://github.com/promises-aplus/cancellation-spec/issues/7)

###`.cancel()` -> `Promise`

Cancel this promise. The cancellation will propagate
to farthest ancestor promise which is still pending.

That ancestor will then be rejected with a CancellationError
object as the rejection reason.

In a promise rejection handler you may check for a cancellation
by seeing if the reason object has `.name === "Cancel"`.

Promises are by default cancellable. If you want to restrict
the cancellability of a promise before handing it out to a
client, call `.uncancellable()` which returns an uncancellable
promise.

###`.fork([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])` -> `Promise`

Like `.then()`, but cancellation of the the returned promise
or any of its descendant will not propagate cancellation
to this promise or this promise's ancestors.

###`.uncancellable()` -> `Promise`

Create an uncancellable promise based on this promise

###`.isCancellable()` -> `boolean`

See if this promise can be cancelled.

##Synchronous inspection

Because `.then()` must give asynchronous guarantees, it cannot be used to inspect a given promise's state synchronously. The following code won't work:

```js
    var wasFulfilled = false;
    var wasRejected = false;
    var resolutionValueOrRejectionReason = null;
    somePromise.then(function(v){
        wasFulfilled = true;
        resolutionValueOrRejectionReason = v
    }).catch(function(v){
        wasRejected = true;
        resolutionValueOrRejectionReason = v
    });
    //Using the variables won't work here because .then must be called asynchronously
 ```
 
Synchronous inspection API allows you to do this like so:

```js
    var inspection = somePromise.inspect();
    
    if(inspection.isFulfilled()){
        console.log("Was fulfilled with", inspection.value());
    }
```

###`.isFulfilled()` -> `boolean`

See if this `promise` has been fulfilled.

###`.isRejected()` -> `boolean`

See if this `promise` has been rejected.

###`.isPending()` -> `boolean`

See if this `promise` is still pending.

###`.isResolved()` -> `boolean`

See if this `promise` is resolved -> either fulfilled or rejected.

###`.inspect()` -> `PromiseInspection`

Synchronously inspect the state of this `promise`. The `PromiseInspection` will represent the state of the promise as snapshotted at the time of calling `.inspect()`. It will have the following methods:

`.isFulfilled()` -> `boolean`

See if the underlying promise was fulfilled at the creation time of this inspection object.

`.isRejected()` -> `boolean`

See if the underlying promise was rejected at the creation time of this inspection object.

`.isPending()` -> `boolean`

See if the underlying promise was pending at the creation time of this inspection object.

`.value()` -> `dynamic`, throws `TypeError`

Get the fulfillment value of the underlying promise. Throws if the promise wasn't fulfilled at the creation time of this inspection object.

`.error()` -> `dynamic`, throws `TypeError`

Get the rejection reason for the underlying promise. Throws if the promise wasn't rejected at the creation time of this inspection object.


##Utility

Functions that could potentially be handy in some situations.

###`.call(String propertyName [, dynamic arg...])` -> `Promise`

This is a convenience method for doing:

```js
    promise.then(function(obj){
        return obj[propertyName].call(obj, arg...);
    });
```

###`.get(String propertyName)` -> `Promise`

This is a convenience method for doing:

```js
    promise.then(function(obj){
        return obj[propertyName];
    });
```

###`.toString()` -> `String`

###`.toJSON()` -> `Object`

This is implicitly called by `JSON.stringify` when serializing the object. Returns a serialized representation of the `Promise`.

###`Promise.promisify(Function nodeFunction [, dynamic receiver])` -> `Function`

Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.

If you pass a `receiver`, the `nodeFunction` will be called as a method on the `receiver`.

Example of promisifying the asynchronous `readFile` of node.js `fs`-module:

```js
    var readFile = Promise.promisify(require("fs").readFile);
    
    readFile("myfile.js", "utf8").then(function(contents){
        return eval(contents);
    }).then(function(result){
        console.log("The result of evaluating myfile.js", result);
    }).catch(SyntaxError, function(e){
        console.log("File had syntax error", e);
    //Catch any other error
    }).catch(function(e){
        console.log("Error reading file", e);
    });
```