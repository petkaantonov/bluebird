---
id: why-promises
title: Why Promises?
---

Promises are a concurrency primitive with a proven track record and language integration in most modern programming languages. They have been extensively studied since the 80s and will make your life much easier.

You should use promises to turn this:

```js
fs.readFile("file.json", function (err, val) {
    if (err) {
        console.error("unable to read file");
    }
    else {
        try {
            val = JSON.parse(val);
            console.log(val.success);
        }
        catch (e) {
            console.error("invalid json in file");
        }
    }
});
```

Into this:

```js
fs.readFileAsync("file.json").then(JSON.parse).then(function (val) {
    console.log(val.success);
})
.catch(SyntaxError, function (e) {
    console.error("invalid json in file");
})
.catch(function (e) {
    console.error("unable to read file");
});
```

*If you're thinking, "There's no `readFileAsync` method on `fs` that returns a promise!" see [promisification](api/promisification.html)*

You might notice that the promise approach looks very similar to using synchronous I/O:

```js
try {
    var val = JSON.parse(fs.readFileSync("file.json"));
    console.log(val.success);
}
// Gecko-only syntax; used for illustrative purposes
catch (e if e instanceof SyntaxError) {
    console.error("invalid json in file");
}
catch (e) {
    console.error("unable to read file");
}
```

This is the point—to have something that works like `return` and `throw` in synchronous code.

You can also use promises to improve code that was written with callbacks:

```js
//Copyright Plato http://stackoverflow.com/a/19385911/995876
//CC BY-SA 2.5
mapSeries(URLs, function (URL, done) {
    var options = {};
    needle.get(URL, options, function (error, response, body) {
        if (error) {
            return done(error);
        }
        try {
            var ret = JSON.parse(body);
            return done(null, ret);
        }
        catch (e) {
            done(e);
        }
    });
}, function (err, results) {
    if (err) {
        console.log(err);
    } else {
        console.log('All Needle requests successful');
        // results is a 1 to 1 mapping in order of URLs > needle.body
        processAndSaveAllInDB(results, function (err) {
            if (err) {
                return done(err);
            }
            console.log('All Needle requests saved');
            done(null);
        });
    }
});
```

This is far more readable when done with promises:

```js
Promise.promisifyAll(needle);
var options = {};

var current = Promise.resolve();
Promise.map(URLs, function (URL) {
    current = current.then(function () {
        return needle.getAsync(URL, options);
    });
    return current;
}).map(function (responseAndBody) {
    return JSON.parse(responseAndBody[1]);
}).then(function (results) {
    return processAndSaveAllInDB(results);
}).then(function () {
    console.log('All Needle requests saved');
}).catch(function (e) {
    console.log(e);
});
```

Also, promises don't just give you correspondences for synchronous features; they can also be used as limited event emitters or callback aggregators.

More reading:

 - [Promise nuggets](https://promise-nuggets.github.io/)
 - [Why I am switching to promises](http://spion.github.io/posts/why-i-am-switching-to-promises.html)
 - [What is the the point of promises](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/#toc_1)
 - [Aren't Promises Just Callbacks?](http://stackoverflow.com/questions/22539815/arent-promises-just-callbacks)
