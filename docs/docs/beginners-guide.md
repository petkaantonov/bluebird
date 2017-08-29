---
id: beginners-guide
title: Beginner's Guide
---

[beginners-guide](unfinished-article)
- [How to implement promises](#how-to-implement)
- [Using Then() and Catch()](#then-and-catch)
- [Promise Chaining](#chaining)
- [What else should I read?](#what-else)


## How to implement simple Bluebird promises

First, [install](install.html) the Bluebird library.

Bluebird makes it simple to convert normal Javascript functions into promise generating ones. After promisifying a function, invoking it will either pass its return value to the next function in the chain or throw an error down to the end of the promise chain. This functionality can be added to individual functions or to entire libraries, such as below:

```js
// Promisfying the Mongoose library:
var Promise = require("bluebird");
Promise.promisifyAll(require("mongoose"));
```
```js
// Promisfying an individual function:
var Promise = require("bluebird");
var readFile = Promise.promisify(require("fs").readFile);
```

This will allow you to call functions from the promisified library by chaining it with [`.then`](.) and [`.catch`](.). Note that the new asynchronous version of `fs.readFile` was stored in a variable. To read more about the promisification process, see [promisification](api/promisification.html).

##Using [`.then`](.) and [`.catch`](.)

Even though the function has been promisified, our implementation is not yet complete. In order to properly implement a Bluebird promise, the function must be chained together with subsequence function calls using [`.then`](.), and [`.catch`](.) is necessary to handle any errors that may occur along the chain. Here is an example of a promise chain using our new promisified `readFile` function:

```js
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

In this promise chain, `readFile()` reads the contents of the Javascript file given to it in the arguments, and passes the results to the [`.then`](.) call, which contains an anonymous function. Inside the anonymous function, the results are passed as an argument to the `eval()` function. Note the `return` inside the [`.then`](.) call. This is an important step, otherwise the results of the function called inside the anonymous function will not be passed to the next function in the chain.

After finishing your sequence of [`.then`](.) calls, you must complete the chain by using [`.catch`](.). Note that you can specify individual errors by passing them as an argument to the [`.catch`](.). This allows for more concise error logging, albeit at the expense of some code readability.

This quick example should help you get on your way to writing more readable, effective asynchronous code using promises. To read more on some of these techniques, check out the links below.

## What else should I read?
[Installation](install.html)
[Why Promises?](why-promises.html)
[Features](features.html)
[Error Explanations](error-explanations.html)