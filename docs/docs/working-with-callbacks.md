---
id: working-with-callbacks
title: Working With Callbacks
---

This page explains how to interface your code with existing callback APIs and libraries you're using. We'll see that making bluebird work with callback APIs is not only easy - it's also fast.

We'll cover several subjects. If you want to get the tl;dr what you need is likely the [Working with callback APIs using the Node convention](#working-with-callback-apis-using-the-node-convention) section.

First to make sure we're on the same page:

Promises have state, they start as pending and can settle to:

 - __fulfilled__ meaning that the computation completed successfully.
 - __rejected__ meaning that the computation failed.

Promise returning functions _should never throw_, they should return rejections instead. Throwing from a promise returning function will force you to use both a `} catch { ` _and_ a `.catch`. People using promisified APIs do not expect promises to throw. If you're not sure how async APIs work in JS - please [see this answer](http://stackoverflow.com/questions/14220321/how-to-return-the-response-from-an-asynchronous-call/16825593#16825593) first.

 * [Automatic vs. Manual conversion](#automatic-vs.-manual-conversion)
 * [Working with callback APIs using the Node convention](#working-with-callback-apis-using-the-node-convention)
 * [Working with one time events.](#working-with-one-time-events)
 * [Working with delays](#working-with-delays/setTimeout)
 * [Working with browser APIs](#working-with-browser-apis)
 * [Working with databases](#working-with-databases)
 * [More Common Examples](#more-common-examples)
 * [Working with any other APIs](#working-with-any-other-apis)

There is also [this more general StackOverflow question](http://stackoverflow.com/questions/22519784/how-do-i-convert-an-existing-callback-api-to-promises) about conversion of callback APIs to promises. If you find anything missing in this guide however, please do open an issue or pull request.

###Automatic vs. Manual conversion

There are two primary methods of converting callback based APIs into promise based ones. You can either manually map the API calls to promise returning functions or you can let the bluebird do it for you. We **strongly** recommend the latter. 

Promises provide a lot of really cool and powerful guarantees like throw safety which are hard to provide when manually converting APIs to use promises. Thus, whenever it is possible to use the `Promise.promisify` and `Promise.promisifyAll` methods - we recommend you use them. Not only are they the safest form of conversion - they also use techniques of dynamic recompilation to introduce very little overhead.

###Working with callback APIs using the Node convention

In Node/io.js most APIs follow a convention of 'error-first, single-parameter' as such:

```js
function getStuff(dat,callback){
...
getStuff("dataParam",function(err,data){

}
```

This APIs are what most core modules in Node/io use and bluebird comes with a fast and efficient way to convert them to promise based APIs through the `Promise.promisify` and `Promise.promisifyAll` function calls.

 - [`Promise.promisify`](/api-reference.html#promise.promisify) - converts a _single_ callback taking function into a promise returning function. It does not alter the original function and returns the modified version.
 - [`Promise.promisifyAll`](/api-reference.html#promise.promisifyall) - takes an _object_ full of functions and _converts each function_ into the new one with the `Async` suffix (by default). It does not change the original functions but instead adds new ones.

> **Note** - please check the linked docs for more parameters and usage examples.

Here's an example of `fs.readFile` with or without promises:

```js
// callbacks
var fs = require("fs");
fs.readFile("name", "utf8", function(err, data){
        
});
```

Promises:

```js
var fs = Promise.promisifyAll(require("fs"));
fs.readFileAsync("name", "utf8").then(function(data){
    
});
```

Note the async suffix was added. Single functions can also be promisified for example:

```js
var request = Promise.promisify(require("request"));
request("foo.bar").then(function(result){
    
});
```

> **Note** `Promise.promisify` and `Promise.promisifyAll` use dynamic recompilation for really fast wrappers and thus calling them should be done only once. [`Promise.fromCallback`](/api-reference.html#promise.fromcallback) exists for cases this is not possible.

###Working with one time events

Sometimes we want to find out when a single one time event has finished. For example - a stream is done. For this we can use the [promise constructor](http://localhost:4000/bluebird/web/docs/api-reference.html#new-promise). Note that this option should be considered only if [automatic conversion](#working-with-callback-apis-using-the-node-convention) isn't possible.

Note that promises model a _single value through time_, they only resolve _once_ - so while they're a good fit for a single event, they are not recommended for multiple event APIs. 

For example, let's say you have a window `onload` event you want to bind to. We can use the promise construction and resolve when the window has loaded as such:

```js

    // onload example, the promise constructor takes a
    // 'resolver' function that tells the promise when
    // to resolve and fire off its `then` handlers.
    var loaded = new Promise(function(resolve, reject){
        window.addEventListener("load", resolve);
    });
    
    loaded.then(function(){
        // window is loaded here
    })

``` 

Here is another example with an API that lets us know when when a connection is ready. The attempt here is imperfect and we'll describe why soon:

```js
function connect(){
   var connection = myConnector.getConnection(); //sync
   return new Promise(function(resolve, reject){
        connection.on("ready", function(){
            // when a connection has been established
            // mark the promise as fulfilled
            resolve(connection);
        });
        connection.on("error", function(e){
            // if it failed connecting, mark it 
            // as rejected.
            reject(e); // e is preferably an `Error`
        });
   });
}
```

The problem with the above is that `getConnection` itself might throw for some reason and if it does we'll get a synchronous rejection. An asynchronous operation should always be asynchronous to prevent double guarding and race conditions so it's best to always put the sync parts inside the promise constructor as such:

```js
function connect(){
   return new Promise(function(resolve, reject){
        // if getConnection throws here instead of getting
        // an exception we're getting a rejection thus
        // producing a much more consistent API.
        var connection = myConnector.getConnection()connection.on("ready", function(){
            // when a connection has been established
            // mark the promise as fulfilled
            resolve(connection);
        });
        connection.on("error", function(e){
            // if it failed connecting, mark it 
            // as rejected.
            reject(e); // e is preferably an `Error`
        });
   });
}
```
###Working with delays/setTimeout

There is no need to convert timeouts/delays to a bluebird API, bluebird already ships with the [`Promise.delay`](/api-reference.html#.delay) function for this use case. Please consult the [Timers section](/api-reference.html#timers) of the docs on usage and examples.

###Working with browser APIs

Often browser APIs are nonstandard and automatic promisification will fail for them. If you're running into an API that you can't promisify with `promisify` and `promisifyAll` - please consult the [working with other APIs section](#working-with-any-other-apis)

###Working with databases

For resource management in general and databases in particular, bluebird includes the powerful  [`Promise.using`](/api-reference.html#promise.using) and disposers system. This is similar to `with` in Python, `using` in C# or try/resource in Java in that it lets you handle resource management in an automatic way. 

Several examples of databases follow.

> **Note** for more examples please see the [`Promise.using`](/api-reference.html#promise.using) section.

####Mongoose/MongoDB

Mongoose works with persistent connections and the driver takes care of reconnections/disposals. For this reason using `using` with it isn't required - instead connect on server startup and use promisification to expose promises.

Note that Mongoose already ships with promise support but the promises it offers are significantly slower and don't report unhandled rejections so it is recommended to use automatic promisification with it anyway:

```js
var Mongoose = Promise.promisifyAll(require("mongoose"));
```

####Sequelize

Sequelize already uses Bluebird promises internally and has promise returning APIs. Use those.

####RethinkDB

Rethink already uses Bluebird promises internally and has promise returning APIs. Use those.

####Bookshelf

Bookshelf already uses Bluebird promises internally and has promise returning APIs. Use those.


####PostgreSQL

Here is how to create a disposer for the PostgreSQL driver:

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

Which would allow you to use:

```js
var using = Promise.using;

using(getSqlConnection(), function(conn){
    // use connection here and _return the promise_

}).then(function(result){
    // connection already disposed here

});
```

It's also possible to use disposers for transaction management:

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

Which would let you do:

```js
using(getTransaction(), function(tx) {
    return tx.queryAsync(...).then(function() {
        return tx.queryAsync(...)
    }).then(function() {
        return tx.queryAsync(...)
    });
});
```

####MySQL

Here is how to create a disposer for the MySQL driver:

```js
var mysql = require("mysql");
// Uncomment if mysql has not been properly promisified yet
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

The usage pattern is similar to the PostgreSQL example above. You can also create a disposer for transactions and use it safely:

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

###More common examples


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

###Working with any other APIs

Sometimes you have to work with APIs that are inconsistent and do not follow any convention.

> **Note** Promise returning function should never throw

For example, something like:

```js
function getUserData(userId, onLoad, onFail){ ...
```

We can use the promise constructor to convert it to a promise returning function:

```js
function getUserDataAsync(userId){
    return new Promise(function(resolve, reject){
        // put all your code here, this section is throw-safe
        getUserData(userId, resolve, reject); 
    });
}
```
