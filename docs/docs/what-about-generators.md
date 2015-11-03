---
id: what-about-generators
title: What About Generators?
---

[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.coroutine

```js
Promise.coroutine(Generator) -> Function(<any value>) -> Promise
```


A generator is a new es6 feature that allows a safe way to create coroutines, iterables and push-pull streams.

here's a quick example.

```javascript

let Promise = require('bluebird');

let someAsyncFunction(val) {
  //returns an aynchronous promise
  return Promise.resolve(val).delay(200);
};

Promise.coroutine(function *(val) {
  return yield someAsyncFunction(val);
})(5)
.tap((val) => console.log(val)) // 5

```

The generator, denoted with the \* is like a function that can stop and start multiple times during its execution. 
Bluebird.coroutine() takes a generator and returns a function that when called, runs the generator. 

The yield keyword is where it gets interesting. By default, when you yield, the value on the right gets returned into a closure where the the value is handled in some meaningful way by the controller function. When the function returned from Promise.coroutine encounters a promise from running the generator, it waits until the promise is resolved or rejected. It then restarts the execution of the generator with the resolved value.

The effect is that the generator coroutine gives you an encapsulated environment where you can write all your async in such a way that it looks synchronous. This can be very useful when you are making multiple successive io calls.

```javascript
//
let signToken = function() {
  return this.fetch()
    .then(() => getData(this.get('email')))
    .then((data) => fetchRoles(data))
    .then((roles) => tokenGenerator.Token({
      uid: this.get('id'),
      orgs: roles
    })
};
//VS
let signToken= Promise.coroutine(function *() {
  yield this.fetch(); //fetch data into the model
  let data = yield getData(this.get('email'));
  let roles = yield fetchRoles(data); //get the roles
  return tokenGenerator.createToken({
    uid: this.get('id'),
    orgs: roles
  })
});

```

