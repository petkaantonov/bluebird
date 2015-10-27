---
id: error-explanations
title: Error Explanations
---

 - [Error: Promise.promisify called on an object](#error-promise.promisify-called-on-an-object)
 - [Error: the promise constructor requires a resolver function](#error-the-promise-constructor-requires-a-resolver-function)
 - [Error: the promise constructor cannot be invoked directly](#error-the-promise-constructor-cannot-be-invoked-directly)
 - [Error: expecting an array, a promise or a thenable](#error-expecting-an-array-a-promise-or-a-thenable)
 - [Error: generatorFunction must be a function](#error-generatorfunction-must-be-a-function)
 - [Error: fn must be a function](#error-fn-must-be-a-function)
 - [Error: cannot enable long stack traces after promises have been created](#error-cannot-enable-long-stack-traces-after-promises-have-been-created)
 - [Error: cannot get fulfillment value of a non-fulfilled promise](#error-cannot-get-fulfillment-value-of-a-non-fulfilled-promise)
 - [Error: cannot get rejection reason of a non-rejected promise](#error-cannot-get-rejection-reason-of-a-non-rejected-promise)
 - [Error: the target of promisifyAll must be an object or a function](#error-the-target-of-promisifyall-must-be-an-object-or-a-function)
 - [Error: circular promise resolution chain](#error-circular-promise-resolution-chain)
 - [Error: cannot await properties of a non-object](#error-cannot-await-properties-of-a-non-object)
 - [Error: expecting a positive integer](#error-expecting-a-positive-integer)
 - [Error: A value was yielded that could not be treated as a promise](#error-a-value-was-yielded-that-could-not-be-treated-as-a-promise)
 - [Error: cannot await properties of a non object](#error-cannot-await-properties-of-a-non-object)
 - [Error: cannot enable long stack traces after promises have been created](#error-cannot-enable-long-stack-traces-after-promises-have-been-created)
 - [Error: Cannot promisify an API that has normal methods](#error-cannot-promisify-an-api-that-has-normal-methods)
 - [Error: Catch filter must inherit from Error or be a simple predicate function](#error-catch-filter-must-inherit-from-error-or-be-a-simple-predicate-function)
 - [Error: No async scheduler available](#error-no-async-scheduler-available)


##Error: Promise.promisify called on an object


You got this this error because you've used `Promise.promisify` on an object, for example:

```js
var fs = Promise.promisify(require("fs"));
```

Instead, use [`Promise.promisifyAll`](.) :

```js
var fs = Promise.promisifyAll(require("fs"));
```

##Error: the promise constructor requires a resolver function

You got this error because you used `new Promise()` or `new Promise(something)` without passing a function as the parameter.

If you want to wrap an API with a promise manually, the correct syntax is:

```js
function wrapWithPromise(parameter) {
    return new Promise(function (resolve, reject) {
        doSomethingAsync({
              error:reject,
              success:resolve
        });
    });
}
```

Please consider reading about [new Promise](.) and also consider checking out automatic [promisification](.) as well as [Promise.method](.)

##Error: the promise constructor cannot be invoked directly

You can get this error for several reasons:

####1. You forgot to use `new` when creating a new promise using `new Promise(resolver)` syntax.

This can happen when you tried to do something like:

    return Promise(function(resolve,reject){
           //...
    })

You can correct this by doing:

    return new Promise(function(resolve,reject){
           //...
    })

Please consider reading about [new Promise](.) and also consider checking out automatic [promisification](.) as well as [Promise.method](.)

####2. You are trying to subclass `Promise`

Bluebird does not support extending promises this way. Instead, see [scoped prototypes](features.html#scoped-prototypes).

##Error: expecting an array, a promise or a thenable

This error message usually happens when trying to work with collections but passing a single element instead.

For example:

```js
function returnThree(){ return 3;}

Promise.resolve(5).map(returnThree).then(function(val){
    console.log("Hello Value!",val);
});
```

The `map` operation is expecting an array here (or a promise on one) and instead gets the number `5`.

##Error: generatorFunction must be a function

You are getting this error when trying to use [Promise.coroutine](.) and not passing it a generator function as a parameter.  For example:

```js
Promise.coroutine(function* () { // Note the *
    var data = yield $.get("http://www.example.com");
    var moreUrls = data.split("\n");
    var contents = [];
    for( var i = 0, len = moreUrls.length; i < len; ++i ) {
        contents.push(yield $.get(moreUrls[i]));
    }
    return contents;
});
```

Please refer to the relevant section in the documentation about [Generators](.) in order to get usage instructions:

**Note**: Bluebird used to eagerly check for generators which caused problems with transpilers. Because of this, you might get an error similar to `TypeError: Cannot read property 'next' of undefined` if you pass a function instead of a generator function to Bluebird.

[Promise.coroutine](.) is built to work with generators to form C# like `async/await`

##Error: fn must be a function

You passed a non-function where a function was expected.

##Error: cannot enable long stack traces after promises have been created

You are getting this error because you are enabling long stack traces after a promise has already been created.

When using `longStackTraces` the first line in your code after requiring Bluebird should be:

```js
Promise.config({
    longStackTraces: true
});
```

See the API page about [Promise.longStackTraces](.)

##Error: cannot get fulfillment value of a non-fulfilled promise

You can get this error when you're trying to call `.value` or `.error` when inspecting a promise where the promise has not been fulfilled or rejected yet.

For example:

```js
var p = Promise.delay(1000);
p.inspect().value();
```

Consider using [.isPending()](.) [.isFulfilled()](.) and [.isRejected()](.) in order to inspect the promise for status.

Please consider reading more about [synchronous inspection](.)

##Error: cannot get rejection reason of a non-rejected promise

You can get this error when you're trying to call `.value` or `.error` when inspecting a promise where the promise has not been fulfilled or rejected yet.

For example:

```js
var p = Promise.delay(1000);
p.inspect().value();
```

Consider using [.isPending()](.) [.isFulfilled()](.) and [.isRejected()](.) in order to inspect the promise for status.

Please consider reading more about [synchronous inspection](.)


##Error: the target of promisifyAll must be an object or a function

This can happen when you are calling [Promise.promisifyAll](.) on a function and invoking it instead of passing it.

In general, the usage of [Promise.promisifyAll](.) is along the lines of `var fs = Promise.promisifyAll(require("fs"))`.

Consider reading the section about [promisification](.)

##Error: circular promise resolution chain

This usually happens when you have a promise that resolves or rejects with itself.

For example: `var p = Promise.delay(100).then(function(){ return p});` .

In this case, the promise resolves with itself which was is not intended.

This also happens when implementing live-updating models with a `.then` method that indicates when the model is "ready". A promise is a process, it starts and it ends.

Promises do not aim to solve such live updating problems directly. One option would be to use an intermediate promise - for example a `.loaded` property on the model that fulfills with nothing.

resolving it with itself tells it "it is done when it is done"

##Error: cannot await properties of a non-object

The `.props` method expects to receive an object.

For example:

```js
Promise.props({
    pictures: getPictures(),
    comments: getComments(),
    tweets: getTweets()
}).then(function(result){
    console.log(result.tweets, result.pictures, result.comments);
});
```

This happens when a non object value or a promise that resolves with something that is not an object is being passed instead.

##Error: expecting a positive integer

This happens when you call `.some` passing it a negative value or a non-integer.

One possible cause is using `.indexOf` which returns `-1` when it doesn't find the value being searched for.

Please consider reading the API docs for [`.some`](.)

##Error: A value was yielded that could not be treated as a promise

You are getting this error because you have tried to `yield` something in a coroutine without a yield handler, for example:

```js
var coroutine = Promise.coroutine(function*(){
    var bar = yield "Foo";
    console.log(bar);
});
```

The solution is to either convert it to a promise by calling `Promise.resolve` on it or `Promise.promisify` if it's a callback:

```js
var coroutine = Promise.coroutine(function*(){
    var bar = yield Promise.resolve("Foo");
    console.log(bar);
});
```

Or to use [Promise.coroutine.addYieldHandler`](.) to teach [Promise.coroutine](.) to accept these sort of values.

##Error: cannot await properties of a non object

The `.props` method expects to receive an object.

For example:

```js
Promise.props({
    pictures: getPictures(),
    comments: getComments(),
    tweets: getTweets()
}).then(function(result){
    console.log(result.tweets, result.pictures, result.comments);
});
```

This happens when a non object value or a promise that resolves with something that is not an object is being passed instead.


##Error: Cannot promisify an API that has normal methods

This error indicates you have tried to call [Promise.promisifyAll](.) on an object that already has a property with the `Async` suffix:

```js
var myApi = { foo: function(cb){ ... }, fooAsync(cb) { ... }
```

This is because Bluebird adds the `Async` suffix to distinguish the original method from the promisified one, so `fooAsync` would have been overridden. In order to avoid this - either rename `fooAsync` before promisifying the API, or call [Promise.promisify](.) manually on select properties.

You may also use the custom suffix option to choose another suffix that doesn't result in conflicts.

If you find this issue in a common library please [open an issue](https://github.com/petkaantonov/bluebird/issues/new)

##Error: Catch filter must inherit from Error or be a simple predicate function

Bluebird supports typed and predicate [.catch()](.) calls]. However in order to use the typed/predicate catch syntax for error handling you must do one of two things.

Pass it a constructor that inherits from `Error`:

    }).catch(ReferenceError, function(e) { // this is fine
    }).catch(Array, function(e) { // arrays don't capture stack traces

This is to enable better stack trace support and to have more consistent and logical code.

Alternatively, if you provide it a predicate be sure it's a simple function:

    }).catch(function(e){ return false; }, function(e) { // this catches nothing
    }).catch(function(e){ return e.someProp = 5; }, function(e) { // this is fine

Please see the API docs of [.catch()](.) on how to use predicate catches.

##Error: No async scheduler available

Async scheduler is a function that takes a callback function and calls the callback function as soon as possible, but asynchronously. For example `setTimeout`.

By default bluebird only tries a few common async schedulers, such as `setTimeout`, `process.nextTick` and `MutationObserver`. However if your JavaScript runtime environment doesn't expose any of these, you will see this error.

You may use [Promise.setScheduler](.) to pass a custom scheduler that your environment supports. For example in DukTape:

```js
Promise.setScheduler(function(fn){ // fn is what to execute
    var timer = uv.new_timer.call({});
    uv.timer_start(timer, 0, 0, fn); // add the function as a callback to the timer
});
```




