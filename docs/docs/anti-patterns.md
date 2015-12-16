---
id: anti-patterns
title: Anti-patterns
---

This page will contain common promise anti-patterns that are exercised in the wild.


- [The explicit construction anti-pattern](#the-deferred-anti-pattern)
- [The `.then(success, fail)` anti-pattern](#the-thensuccess-fail-anti-pattern)

##The Explicit Construction Anti-Pattern

This is the most common anti-pattern. It is easy to fall into this when you don't really understand promises and think of them as glorified event emitters or callback utility. It's also sometimes called the promise constructor anti-pattern. Let's recap: promises are about making asynchronous code retain most of the lost properties of synchronous code such as flat indentation and one exception channel. This pattern is also called the deferred anti-pattern.

In the explicit construction anti-pattern, promise objects are created for no reason, complicating code.

First example is creating deferred object when you already have a promise or thenable:

```js
//Code copyright by Twisternha http://stackoverflow.com/a/19486699/995876 CC BY-SA 2.5
myApp.factory('Configurations', function (Restangular, MotorRestangular, $q) {
    var getConfigurations = function () {
        var deferred = $q.defer();

        MotorRestangular.all('Motors').getList().then(function (Motors) {
            //Group by Config
            var g = _.groupBy(Motors, 'configuration');
            //Map values
            var mapped = _.map(g, function (m) {
                return {
                    id: m[0].configuration,
                    configuration: m[0].configuration,
                    sizes: _.map(m, function (a) {
                        return a.sizeMm
                    })
                }
            });
            deferred.resolve(mapped);
        });
        return deferred.promise;
    };

    return {
        config: getConfigurations()
    }

});
```

This superfluous wrapping is also dangerous, any kind of errors and rejections are swallowed and not propagated to the caller of this function.

Instead of using the Deferred anti-pattern, the code should simply return the promise it already has and propagate values using `return`:

```js
myApp.factory('Configurations', function (Restangular, MotorRestangular, $q) {
    var getConfigurations = function () {
        //Just return the promise we already have!
        return MotorRestangular.all('Motors').getList().then(function (Motors) {
            //Group by Cofig
            var g = _.groupBy(Motors, 'configuration');
            //Return the mapped array as the value of this promise
            return _.map(g, function (m) {
                return {
                    id: m[0].configuration,
                    configuration: m[0].configuration,
                    sizes: _.map(m, function (a) {
                        return a.sizeMm
                    })
                }
            });
        });
    };

    return {
        config: getConfigurations()
    }

});
```

Not only is the code shorter but more importantly, if there is any error it will propagate properly to the final consumer.

Second example is creating a function that does nothing but manually wrap a callback API and doing a poor job at that:

```js
function applicationFunction(arg1) {
    return new Promise(function(resolve, reject){ //Or Q.defer() in Q
      libraryFunction(arg1, function (err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
    });
}
```

This is reinventing the square wheel because any callback API wrapping can and should be done immediately using the promise library's promisification methods:

```js
var applicationFunction = Promise.promisify(libraryFunction);
```

The generic promisification is likely to be faster because it can use internals directly but also handles edge cases like `libraryFunction` throwing synchronously or using multiple success values.


**So when should deferred be used?**

Well simply, when you have to.

You might have to use a deferred object when wrapping a callback API that doesn't follow the standard convention. Like `setTimeout`:

```js
//setTimeout that returns a promise
function delay(ms) {
    var deferred = Promise.pending();
    setTimeout(function(){
        deferred.fulfill();
    }, ms);
    return deferred.promise;
}
```

Such wrappers should be rare, if they're common for the reason that the promise library cannot generically promisify them, you should file an issue.

Also see [this StackOverflow question](http://stackoverflow.com/questions/23803743/what-is-the-deferred-antipattern-and-how-do-i-avoid-it) for more examples and a debate around it.

##The `.then(success, fail)` anti-pattern

*Almost* a sure sign of using promises as glorified callbacks. Instead of `doThat(function(err, success))` you do `doThat().then(success, err)` and rationalize to yourself that at least the code is "less coupled" or something.

The `.then` signature is mostly about interop, there is *almost* never a reason to use `.then(success, fail)` in application code. It is even awkward to express it in the sync parallel:

```js
var t0;
try {
    t0 = doThat();
}
catch(e) {

}
//deal with t0 here and waste the try-catch
var stuff = JSON.parse(t0);
```

It is more likely that you would write this instead in the sync world:

```js
try {
    var stuff = JSON.parse(doThat());
}
catch(e) {

}
```

So please write the same when using promises too:

```js
doThat()
.then(function(v) {
    return JSON.parse(v);
})
.catch(function(e) {

});
```

`.catch` is specified for built-in Javascript promises and is "sugar" for `.then(null, function(){})`. Since the way errors work in promises is almost the entire point (and the only thing jQuery never got right, even if it used `.pipe` as a `.then`), I really hope the implementation you are using provides this method for readability.
