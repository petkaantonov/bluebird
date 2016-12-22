---
id: beginners-guide
title: Beginner's Guide
---

## Simple usage 

###### 1. Requiring bluebird

```js
const Promise = require("bluebird")
```

###### 2. Create a new promise with your own function

```js
function doSomething(){
  return new Promise(function(resolve,reject){
    // some async tasks
    setTimeout(resolve,3000)
  })
}

const result = doSomething()
```

###### 3. Follow-up actions once the promise is returned

```js
result.then(() => {
  console.log("I am now doing something after receving the promise from 3 seconds ago")
}).catch(() => {
  console.log("some error happened")
})
```







[beginners-guide](unfinished-article)
