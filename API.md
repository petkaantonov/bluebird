#API Reference

- [Core](#core)
    - [`new Promise(Function<Function resolve, Function reject> resolver)`](#new-promisefunctionfunction-resolve-function-reject-resolver---promise)
    - [`.then([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])`](#thenfunction-fulfilledhandler--function-rejectedhandler---function-progresshandler----promise)
    - [`.catch(Function handler)`](#catchfunction-handler---promise)
    - [`.catch([Function ErrorClass...], Function handler)`](#catchfunction-errorclass-function-handler---promise)
    - [`.finally(Function handler)`](#finallyfunction-handler---promise)
    - [`.progressed(Function handler)`](#progressedfunction-handler---promise)
    - [`.done([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])`](#donefunction-fulfilledhandler--function-rejectedhandler---function-progresshandler----promise)
    - [`Promise.fulfilled(dynamic value)`](#promisefulfilleddynamic-value---promise)
    - [`Promise.rejected(dynamic reason)`](#promiserejecteddynamic-reason---promise)
    - [`Promise.pending()`](#promisepending---promiseresolver)
    - [`Promise.cast(dynamic value)`](#promisecastdynamic-value---promise)
    - [`Promise.is(dynamic value)`](#promiseisdynamic-value---boolean)
- [Promise resolution](#promise-resolution)
    - [`.fulfill(dynamic value)`](#fulfilldynamic-value---undefined)
    - [`.reject(dynamic reason)`](#rejectdynamic-reason---undefined)
    - [`.progress(dynamic value)`](#progressdynamic-value---undefined)
- [Collections](#collections)
    - [`.all()`](#all---promise)
    - [`.settle()`](#settle---promise)
    - [`.any()`](#any---promise)
    - [`.some(int count)`](#someint-count---promise)
    - [`.spread([Function fulfilledHandler] [, Function rejectedHandler ])`](#spreadfunction-fulfilledhandler--function-rejectedhandler----promise)
    - [`.map(Function mapper)`](#mapfunction-mapper---promise)
    - [`.reduce(Function reducer [, dynamic initialValue])`](#reducefunction-reducer--dynamic-initialvalue---promise)
    - [`Promise.all(Array<dynamic> values)`](#promiseallarraydynamic-values---promise)
    - [`Promise.settle(Array<dynamic> values)`](#promisesettlearraydynamic-values---promise)
    - [`Promise.any(Array<dynamic> values)`](#promiseanyarraydynamic-values---promise)
    - [`Promise.some(Array<dynamic> values, int count)`](#promisesomearraydynamic-values-int-count---promise)
    - [`Promise.join([dynamic value...])`](#promisejoindynamic-value---promise)
    - [`Promise.map(Array<dynamic> values, Function mapper)`](#promisemaparraydynamic-values-function-mapper---promise)
    - [`Promise.reduce(Array<dynamic> values, Function reducer [, dynamic initialValue])`](#promisereducearraydynamic-values-function-reducer--dynamic-initialvalue---promise)
- [Cancellation](#cancellation)
    - [`.cancel()`](#cancel---promise)
    - [`.fork([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])`](#forkfunction-fulfilledhandler--function-rejectedhandler---function-progresshandler----promise)
    - [`.uncancellable()`](#uncancellable---promise)
    - [`.isCancellable()`](#iscancellable---boolean)
- [Synchronous inspection](#synchronous-inspection)
    - [`.isFulfilled()`](#isfulfilled---boolean)
    - [`.isRejected()`](#isrejected---boolean)
    - [`.isPending()`](#ispending---boolean)
    - [`.isResolved()`](#isresolved---boolean)
    - [`.inspect()`](#inspect---promiseinspection)
- [Utility](#utility)
    - [`.call(String propertyName [, dynamic arg...])`](#callstring-propertyname--dynamic-arg---promise)
    - [`.get(String propertyName)`](#getstring-propertyname---promise)
    - [`.nodeify([Function callback])`](#nodeifyfunction-callback---promise)
    - [`.toString()`](#tostring---string)
    - [`.toJSON()`](#tojson---object)
    - [`Promise.promisify(Object target)`](#promisepromisifyobject-target---object)
    - [`Promise.promisify(Function nodeFunction [, dynamic receiver])`](#promisepromisifyfunction-nodefunction--dynamic-receiver---function)
    - [`Promise.coroutine(GeneratorFunction generatorFunction)`](#promisecoroutinegeneratorfunction-generatorfunction---function)
    - [`Promise.spawn(GeneratorFunction generatorFunction)`](#promisespawngeneratorfunction-generatorfunction---promise)
    - [`Promise.noConflict()`](#promisenoconflict---object)
    - [`Promise.onPossiblyUnhandledRejection(Function handler)`](#promiseonpossiblyunhandledrejectionfunction-handler---undefined)

##Core

Core methods of `Promise` instances and core static methods of the Promise class.

#####`new Promise(Function<Function resolve, Function reject> resolver)` -> `Promise`

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


    
#####`.then([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])` -> `Promise`

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

#####`.catch(Function handler)` -> `Promise`

This is a catch-all exception handler, shortcut for calling `.then(null, handler)` on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

*For compatibility with earlier ECMAScript version, an alias `.caught()` is provided for `.catch()`.*

#####`.catch([Function ErrorClass...], Function handler)` -> `Promise`

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
    
*For compatibility with earlier ECMAScript version, an alias `.caught()` is provided for `.catch()`.*
        
#####`.finally(Function handler)` -> `Promise`

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
    
*For compatibility with earlier ECMAScript version, an alias `.lastly()` is provided for `.finally()`.*

#####`.progressed(Function handler)` -> `Promise`

Shorthand for `.then(null, null, handler);`. Attach a progress handler that will be called if this promise is progressed. Returns a new promise chained from this promise.

#####`.done([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])` -> `Promise`

Like `.then()`, but any unhandled rejection that ends up here will be thrown as an error.

#####`Promise.try(Function fn)` -> `Promise`

Start the chain of promises with `Promise.try`. Any synchronous exceptions will be turned into rejections on the returned promise.

```js
function getUserById(id) {
    return Promise.try(function(){
        if (typeof id !== "number") {
            throw new Error("id must be a number");
        }
        return db.getUserById(id);
    });
}
```

Now if someone uses this function, they will catch all errors in their Promise `.catch` handlers instead of having to handle both synchronous and asynchronous exception flows.

*For compatibility with earlier ECMAScript version, an alias `Promise.attempt()` is provided for `Promise.try()`.*

#####`Promise.fulfilled(dynamic value)` -> `Promise`

Create a promise that is fulfilled with the given `value`. If `value` is a trusted `Promise`, the promise will instead follow that promise, adapting to its state. The promise is synchronously fulfilled in the former case.

#####`Promise.rejected(dynamic reason)` -> `Promise`

Create a promise that is rejected with the given `reason`. The promise is synchronously rejected.

#####`Promise.pending()` -> `PromiseResolver`

Create a promise with undecided fate and return a `PromiseResolver` to control it. See [Promise resultion](#promise-resolution).

#####`Promise.cast(dynamic value)` -> `Promise`

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

#####`Promise.is(dynamic value)` -> `boolean`

See if `value` is a trusted Promise.

```js
Promise.is($.get("http://www.google.com")); //false
Promise.is(Promise.cast($.get("http://www.google.com"))) //true
```

##Promise resolution

A `PromiseResolver` can be used to control the fate of a promise. It is like "Deferred" known in jQuery. The `PromiseResolver` objects have a `.promise` property which returns a reference to the controlled promise that can be passed to clients. `.promise` of a `PromiseResolver` is not a getter function to match other implementations.

The methods of a `PromiseResolver` have no effect if the fate of the underlying promise is already decided (follow, reject, fulfill).

#####`.fulfill(dynamic value)` -> `undefined`

Fulfill the underlying promise with `value` as the fulfillment value. If `value` is a trusted `Promise`, the underlying promise will instead follow that promise, adapting to its state.

#####`.reject(dynamic reason)` -> `undefined`

Reject the underlying promise with `reason` as the rejection reason.

#####`.progress(dynamic value)` -> `undefined`

Progress the underlying promise with `value` as the progression value.

Example

```js
function delay(ms) {
    var resolver = Promise.pending();
    var now = Date.now();
    setTimeout(function(){
        resolver.fulfill(Date.now() - now);
    }, ms);
    return resolver.promise;
}

delay(500).then(function(ms){
    console.log(ms + " ms passed");
});
```

##Collections

Methods of `Promise` instances and core static methods of the Promise class to deal with
collections of promises or mixed promises and values.

#####`.all()` -> `Promise`

Same as calling [Promise.all\(thisPromise\)](#promiseallarraydynamic-values---promise)

#####`.settle()` -> `Promise`

Same as calling [Promise.settle\(thisPromise\)](#promisesettlearraydynamic-values---promise).

#####`.any()` -> `Promise`

Same as calling [Promise.any\(thisPromise\)](#promiseanyarraydynamic-values---promise).

#####`.some(int count)` -> `Promise`

Same as calling [Promise.some\(thisPromise, count\)](#promisesomearraydynamic-values-int-count---promise)

#####`.spread([Function fulfilledHandler] [, Function rejectedHandler ])` -> `Promise`

Like calling `.then`, but the fulfillment value or rejection reason is assumed to be an array, which is flattened to the formal parameters of the handlers.

```js
Promise.all([task1, task2, task3]).spread(function(result1, result2, result3){

});
```

Normally using when using `.then` the code would be like:

```js
Promise.all([task1, task2, task3]).then(function(results){
    var result1 = results[0];
    var result2 = results[1];
    var result3 = results[2];
});
```

This is useful when the results are not conceptually items of the same list.

#####`.map(Function mapper)` -> `Promise`

Same as calling [Promise.map\(thisPromise, mapper\)](#promisemaparraydynamic-values-function-mapper---promise).

#####`.reduce(Function reducer [, dynamic initialValue])` -> `Promise`

Same as calling [Promise.reduce\(thisPromise, Function reducer, initialValue\)](#promisereducearraydynamic-values-function-reducer--dynamic-initialvalue---promise).

#####`Promise.all(Array<dynamic> values)` -> `Promise`

Given an array, or a promise of an array, which contains promises (or a mix of promises and values) return a promise that is fulfilled when all the items in the array are fulfilled. The promise's fulfillment value is an array with fulfillment values at respective positions to the original array. If any promise in the array rejects, the returned promise is rejected with the rejection reason.

In this example we create a promise that is fulfilled only when the pictures, comments and tweets are all loaded.

```js
Promise.all([getPictures(), getComments(), getTweets()].then(function(results){
    //Everything loaded and good to go
    var pictures = results[0];
    var comments = results[1];
    var tweets = results[2];
}).catch(function(e){
    alertAsync("error when getting your stuff");
});
```

See [`.spread\(\)`](#spreadfunction-fulfilledhandler--function-rejectedhandler----promise) for a more convenient way to extract the fulfillment values.

*The original array is not modified. The input array sparsity is retained in the resulting array.*

#####`Promise.settle(Array<dynamic> values)` -> `Promise`

Given an array, or a promise of an array, which contains promises (or a mix of promises and values) return a promise that is fulfilled when all the items in the array are either fulfilled or rejected. The fulfillment value is an array of [`PromiseInspection`](#inspect---promiseinspection) instances at respective positions in relation to the input array.

*The original array is not modified. The input array sparsity is retained in the resulting array.*

#####`Promise.any(Array<dynamic> values)` -> `Promise`

Like [`Promise.some\(\)`](#someint-count---promise), with 1 as `count`. However, if the promise fulfills, the fulfillment value is not an array of 1 but the value directly.

#####`Promise.some(Array<dynamic> values, int count)` -> `Promise`

Initiate a competetive race between multiple promises or values (values will become immediately fulfilled promises). When `count` amount of promises have been fulfilled, the returned promise is fulfilled with an array that contains the fulfillment values of the winners in order of resolution.

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

If too many promises are rejected so that the promise can never become fulfilled, it will be immediately rejected with an array of rejection reasons in the order they were thrown in.

*The original array is not modified.*

#####`Promise.join([dynamic value...])` -> `Promise`

Like [`Promise.all\(\)`](#promiseallarraydynamic-values---promise) but instead of having to pass an array, the array is generated from the passed variadic arguments.

So instead of:

```js
Promise.all([a, b]).spread(function(aResult, bResult) {

});
```

You can do:

```js
Promise.join(a, b).spread(function(aResult, bResult) {

});
```

#####`Promise.map(Array<dynamic> values, Function mapper)` -> `Promise`

Map an array, or a promise of an array, which contains a promises (or a mix of promises and values) with the given `mapper` function with the signature `(item, index, arrayLength)` where `item` is the resolved value of a respective promise in the input array. If any promise in the input array is rejected the returned promise is rejected as well.

If the `mapper` function returns promises, the returned promise will wait for all the mapped results to be resolved as well.

*(TODO: an example where this is useful)*

*The original array is not modified. Sparse array holes are not visited and the resulting array retains the same sparsity as the original array.*

#####`Promise.reduce(Array<dynamic> values, Function reducer [, dynamic initialValue])` -> `Promise`

Reduce an array, or a promise of an array, which contains a promises (or a mix of promises and values) with the given `reducer` function with the signature `(total, current, index, arrayLength)` where `item` is the resolved value of a respective promise in the input array. If any promise in the input array is rejected the returned promise is rejected as well.

*(TODO: an example where this is useful)*

*The original array is not modified. Sparse array holes are not visited. If no `intialValue` is given and the array doesn't contain at least 2 items, the callback will not be called and `undefined` is returned. If `initialValue` is given and the array doesn't have at least 1 item, `initialValue` is returned.*

##Cancellation

By default, all Promises are cancellable. A cancellable promise can be cancelled if it's not resolved. Cancelling a promise propagates to the farthest ancestor of the target promise that is still pending, and rejects that promise with `CancellationError`. The rejection will then propagate back to the original promise and to its descendants. This roughly follows the semantics described [here](https://github.com/promises-aplus/cancellation-spec/issues/7)

If you are the resolver for a promise, you can react to a cancel in your promise by catching the `CancellationError`:

```js
function ajaxGetAsync(url) {
    var xhr = new XMLHttpRequest;
    return new Promise(function (resolve, reject) {
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        xhr.send(null);
    }).catch(Promise.CancellationError, function(e) {
        xhr.abort();
        throw e; //Don't swallow it
    });
}
```

#####`.cancel()` -> `Promise`

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

#####`.fork([Function fulfilledHandler] [, Function rejectedHandler ] [, Function progressHandler ])` -> `Promise`

Like `.then()`, but cancellation of the the returned promise
or any of its descendant will not propagate cancellation
to this promise or this promise's ancestors.

#####`.uncancellable()` -> `Promise`

Create an uncancellable promise based on this promise

#####`.isCancellable()` -> `boolean`

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

#####`.isFulfilled()` -> `boolean`

See if this `promise` has been fulfilled.

#####`.isRejected()` -> `boolean`

See if this `promise` has been rejected.

#####`.isPending()` -> `boolean`

See if this `promise` is still pending.

#####`.isResolved()` -> `boolean`

See if this `promise` is resolved -> either fulfilled or rejected.

#####`.inspect()` -> `PromiseInspection`

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

#####`.call(String propertyName [, dynamic arg...])` -> `Promise`

This is a convenience method for doing:

```js
promise.then(function(obj){
    return obj[propertyName].call(obj, arg...);
});
```

#####`.get(String propertyName)` -> `Promise`

This is a convenience method for doing:

```js
promise.then(function(obj){
    return obj[propertyName];
});
```

#####`.nodeify([Function callback])` -> `Promise`

Register a node-style callback on this promise. When this promise is is either fulfilled or rejected, the node callback will be called back with the node.js convention where error reason is the first argument and success value is the second argument. The error argument will be `null` in case of success.

Returns back this promise instead of creating a new one. If the `callback` argument is not a function, this method does not do anything.

This can be used to create APIs that both accept node-style callbacks and return promises:

```js
function getDataFor(input, callback) {
    return dataFromDataBase(input).nodeify(callback);
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

There is no effect on peformance if the user doesn't actually pass a node-style callback function.


#####`.toString()` -> `String`

#####`.toJSON()` -> `Object`

This is implicitly called by `JSON.stringify` when serializing the object. Returns a serialized representation of the `Promise`.



#####`Promise.promisify(Object target)` -> `Object`

Promisifies the entire object by going through the object and creating an async equivalent of each function on the object. The promisified method name will be the original method name postfixed with `Async`. Returns the input object.

Example:

```js
Promise.promisify(RedisClient.prototype);

//Later on, all redis client instances have promise returning functions:

redisClient.hexistsAsync("myhash", "field").then(function(v){

}).catch(function(e){

});
```

It also works on singletons or specific instances:

```js
var fs = Promise.promisify(require("fs"));

fs.readFileAsync("myfile.js", "utf8").then(function(contents){
    console.log(contents);
}).catch(function(e){
    console.error(e.stack);
});
```

Only enumerable own properties are considered. A specific object will only be promisified once. The target methods are assumed to conform to node.js callback convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument. If the node method calls its callback with multiple success values, the fulfillment value will be an array of them.

If a method already has `"Async"` postfix, it will be duplicated. E.g. `getAsync`'s promisified name is `getAsyncAsync`.

#####`Promise.promisify(Function nodeFunction [, dynamic receiver])` -> `Function`

Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.

If the `nodeFunction` calls its callback with multiple success values, the fulfillment value will be an array of them.

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

Note that if the node function is a method of some object, you need to pass the object as the second argument like so:

```js
var redisGet = Promise.promisify(redisClient.get, redisClient);
redisGet.then(function(){
    //...
});
```



#####`Promise.coroutine(GeneratorFunction generatorFunction)` -> `Function`

Returns a function that can use `yield` to run asynchronous code synchronously. This feature requires the support of generators which are drafted in the next version of the language. Node version greater than `0.11.2` is required and needs to be executed with the `--harmony-generators` (or `--harmony`) command-line switch.

This is the recommended, simplest and most performant way of using asynchronous generators with bluebird. It is even faster than typical promise code because the creation of anonymous functions can be completely avoided.

```js
var Promise = require("bluebird");

function delay(ms) {
    return new Promise(function(f){
        setTimeout(f, ms);
    });
}

function PingPong() {

}

PingPong.prototype.ping = Promise.coroutine(function* (val) {
    console.log("Ping?", val)
    yield delay(500)
    this.pong(val+1)
});

PingPong.prototype.pong = Promise.coroutine(function* (val) {
    console.log("Pong!", val)
    yield delay(500);
    this.ping(val+1)
});

var a = new PingPong();
a.ping(0);
```

Running the example with node version at least 0.11.2:

    $ node --harmony test.js
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

Doing `Promise.coroutine(function*(){})` is like using the C# `async` keyword to mark the function, with `yield` working as the `await` keyword. Promises are `Task`s.

#####`Promise.spawn(GeneratorFunction generatorFunction)` -> `Promise`

Spawn a coroutine which may yield promises to run asynchronous code synchronously. This feature requires the support of generators which are drafted in the next version of the language. Node version greater than `0.11.2` is required and needs to be executed with the `--harmony-generators` (or `--harmony`) command-line switch.

```js
Promise.spawn(function* () {
    var data = yield $.get("http://www.example.com");
    var moreUrls = data.split("\n");
    var contents = [];
    for( var i = 0, len = moreUrls.length; i < len; ++i ) {
        contents.push(yield $.get(moreUrls[i]));
    }
    return contents;
});
```

In the example is returned a promise that will eventually have the contents of the urls separated by newline on example.com.

Note that you need to try-catch normally in the generator function, any uncaught exception is immediately turned into a rejection on the returned promise. Yielding a promise that gets rejected causes a normal error inside the generator function.

**Tip:**

When `Promise.spawn` is called as a method of an object, that object becomes the receiver of the generator function too.

```js
function ChatRoom(roomId) {
    this.roomId = roomId
}
ChatRoom.prototype.spawn = Promise.spawn;

ChatRoom.prototype.addUser = function( userId ) {
    return this.spawn(function* () {
        var isBanned = yield chatStore.userIsBannedForRoom(this.roomId, userId);
        if (isBanned) {
            throw new ChatError("You have been banned from this room");
        }
        return chatStore.addUserToRoom(this.roomId, userId);
    });
};

var room = new ChatRoom(1);
room.addUser(2);
```

In the above example, all the methods of `ChatRoom` can avoid the `var self = this` prologue and just use `this` normally inside the generator.

#####`Promise.noConflict()` -> `Object`

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
var promise = Bluebird.cast(new Promise());
</script>
```

#####`Promise.onPossiblyUnhandledRejection(Function handler)` -> `undefined`

Add `handler` as the handler to call when there is a possibly unhandled rejection. The default handler logs the error stack to stderr or `console.error` in browsers.

```html
Promise.onPossiblyUnhandledRejection(function(e){
    throw e;
});
```

Passing no value or a non-function will have the effect of removing any kind of handling for possibly unhandled rejections.