---
id: warning-explanations
title: Warning Explanations
---

[warning-explanations](unfinished-article)

 - [Warning: .then() only accepts functions](#warning-.then)
 - [Warning: a promise was rejected with a non-error](#warning-a-promise-was-rejected-with-a-non-error)
 - [Warning: a promise was created in a handler but was not returned from it](#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it)

Note - in order to get full stack traces with warnings in Node 6.x+ you need to enable to `--trace-warnings` flag which will give you a full stack trace of where the warning is coming from.

##Warning: .then() only accepts functions

If you see this warning your code is probably not doing what you expect it to, the most common reason is passing the *result* of calling a function to [.then()](.) instead of the function *itself*:

```js
function processImage(image) {
    // Code that processes image
}

getImage().then(processImage());
```

The above calls the function `processImage()` *immediately* and passes the result to [.then()](.) (which is most likely `undefined` - the default return value when a function doesn't return anything).

To fix it, simply pass the function reference to [.then()](.) as is:

```js
getImage().then(processImage)
```

*If you are wondering why this is a warning and not a simple TypeError it is because the due to historic reasons Promises/A+ specification requires that incorrect usage is silently ignored.*

##Warning: a promise was rejected with a non-error

Due to a historic mistake in JavaScript, the `throw` statement is allowed to be used with any value, not just errors, and Promises/A+ choosing to inherit this mistake, it is possible to reject a promise with a value that is not an error.

An error is an object that is a `instanceof Error`. It will at minimum have the properties `.stack` and `.message`, which are an absolute must to have for any value that is being used in an automatic propagation mechanism such as exceptions and rejections. This is because errors are usually handled many levels above from where they actually originated from - the error object must have sufficient metadata about it so that its ultimate handler many levels above will have all the information needed for creating a useful high level error report.

Since all objects support having properties you might still wonder why exactly does it have to be an error object and not just any object. In addition to supporting properties, an equally important feature necessary for values that are automatically propagated is the stack trace property (`.stack`). A stack trace allows you easily find where an error originated from.

You should heed this warning because rejecting a promise with a non-error makes debugging extremely hard and costly. Additionally, if you reject with simple primitives such as `undefined` (commonly caused by simple calling `reject()`) you cannot handle errors at all because it's impossible to tell from `undefined` what exactly went wrong. All you can tell the user is that "something went wrong" and lose them forever.


##Warning: a promise was created in a handler but was not returned from it

This usually means that you simply forgot a `return` statement somewhere which will cause a runaway promise that is not connected to any promise chain.

For example:

```js
getUser().then(function(user) {
    getUserData(user);
}).then(function(userData) {
    // userData is undefined
});
```

Because the result of `getUserData()` is not returned from the first then handler, it becomes a runaway promise that is not awaited for by the second then. The second [.then()](.) simply gets immediately called with `undefined` (because `undefined` is the default return value when you don't return anything).

To fix it, you need to `return` the promise:

```js
getUser().then(function(user) {
    return getUserData(user);
}).then(function(userData) {
    // userData is the user's data
});
```

<hr>

If you know what you're doing and don't want to silence all warnings, you can create runaway promises without causing this warning by returning e.g. `null`:

```js
getUser().then(function(user) {
    // Perform this in the "background" and don't care about its result at all
    saveAnalytics(user);
    // return a non-undefined value to signal that we didn't forget to return
    return null;
});
```


