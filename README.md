<a href="http://promisesaplus.com/">
    <img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

#Introduction

Bluebird is a full featured [promise](#what-are-promises-and-why-should-i-use-them) library with unmatched performance.

Features:

- [Promises A+ 3.x.x](https://github.com/promises-aplus/promises-spec)
- [Promises A+ 2.x.x](https://github.com/domenic/promises-unwrapping)
- [Cancellation](https://github.com/promises-aplus)
- [Progression](https://github.com/promises-aplus/progress-spec)
- [Synchronous inspection](https://github.com/promises-aplus/synchronous-inspection-spec)
- All, any, some, settle, map, reduce, spread, join...
- [Unhandled rejections and long, relevant stack traces](#error-handling)
- [Sick performance](https://github.com/petkaantonov/bluebird/tree/master/benchmark/stats)

Passes [AP2](https://github.com/petkaantonov/bluebird/tree/master/test/mocha), [AP3](https://github.com/petkaantonov/bluebird/tree/master/test/mocha), [Cancellation](https://github.com/petkaantonov/bluebird/blob/master/test/mocha/cancel.js), [Progress](https://github.com/petkaantonov/bluebird/blob/master/test/mocha/q_progress.js), [promises_unwrapping](https://github.com/petkaantonov/bluebird/blob/master/test/mocha/promises_unwrapping.js) (Just in time thenables), [Q](https://github.com/petkaantonov/bluebird/tree/master/test/mocha) and [When.js](https://github.com/petkaantonov/bluebird/tree/master/test) tests. See [testing](#testing).

[API Reference and examples](https://github.com/petkaantonov/bluebird/blob/master/API.md)

#Quick start

##Node.js

    npm install bluebird


Then:

```js
var Promise = require("bluebird");
```    
##Browsers

Download the [bluebird_debug.js](https://github.com/petkaantonov/bluebird/blob/master/js/bluebird_debug.js) file. And then use a script tag:

```html
<script type="text/javascript" src="/scripts/bluebird_debug.js"></script>
```

The global variable `Promise` becomes available after the above script tag. The debug file has long stack traces and assertions enabled, which degrade performance substantially but not enough to matter for anything you could do with promises on the browser.

After quick start, see [API Reference and examples](https://github.com/petkaantonov/bluebird/blob/master/API.md)


#What are promises and why should I use them?

You should use promises to make robust asynchronous programming a joy.

More info:

- [You're missing the point of promises](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/).

#Error handling

This is a problem every promise library needs to handle in some way. Unhandled rejections/exceptions don't really have a good agreed-on asynchronous correspondence. The problem is that it is impossible to predict the future and know if a rejected promise will eventually be handled.

There are two common pragmatic attempts at solving the problem that promise libraries do.

The more popular one is to have the user explicitly communicate that they are done and any unhandled rejections should be thrown, like so:

```js
download().then(...).then(...).done();
```

For handling this problem, in my opinion, this is completely unacceptable and pointless. The user must remember to explicitly call `.done` and that cannot be justified when the problem is forgetting to create an error handler in the first place.

The second approach, which is what bluebird by default takes, is to call a registered handler if a rejection is unhandled by the start of a second turn. The default handler is to write the stack trace to stderr or `console.error` in browsers. This is close to what happens with synchronous code - your code doens't work as expected and you open console and see a stack trace. Nice.

Of course this is not perfect, if your code for some reason needs to swoop in and attach error handler to some promise after the promise has been hanging around a while then you will see annoying messages. In that case you can use the `.done()` method to signal that any hanging exceptions should be thrown.

If you want to override the default handler for these possibly unhandled rejections, you can pass yours like so:

```js
Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});
```

If you want to also enable long stack traces, call:

```js
Promise.longStackTraces();
```

right after the library is loaded. Long stack traces cannot be disabled after being enabled, and cannot be enabled after promises have alread been created. Long stack traces imply a substantial performance penalty, even after using every trick to optimize them.

Long stack traces are enabled by default in the debug build.

####How do long stack traces differ from e.g. Q?

Bluebird attempts to have more elaborate traces. Consider:

```js
Error.stackTraceLimit = 25;
Q.longStackSupport = true;
Q().then(function outer() {
    return Q().then(function inner() {
        return Q().then(function evenMoreInner() {
            a.b.c.d();
        }).catch(function catcher(e){
            console.error(e.stack);
        });
    })
});
```

You will see

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:7:13)
    From previous event:
        at inner (<anonymous>:6:20)

Compare to:

```js
Error.stackTraceLimit = 25;
Promise.longStackTraces();
Promise.fulfilled().then(function outer() {
    return Promise.fulfilled().then(function inner() {
        return Promise.fulfilled().then(function evenMoreInner() {
            a.b.c.d()
        }).catch(function catcher(e){
            console.error(e.stack);
        });
    });
});
```

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:7:13)
    From previous event:
        at inner (<anonymous>:6:36)
    From previous event:
        at outer (<anonymous>:5:32)
    From previous event:
        at <anonymous>:4:21
        at Object.InjectedScript._evaluateOn (<anonymous>:572:39)
        at Object.InjectedScript._evaluateAndWrap (<anonymous>:531:52)
        at Object.InjectedScript.evaluate (<anonymous>:450:21)
        

A better and more practical example of the differences can be seen in gorgikosev's [debuggability competition](https://github.com/spion/async-compare#debuggability). (for `--error` and `--throw`, promises don't actually need to handle `--athrow` since that is something someone using a promises would never do)

#Development

For development tasks such as running benchmarks or testing, you need to clone the repository and install dev-dependencies.

Install [node](http://nodejs.org/), [npm](https://npmjs.org/), and [grunt](http://gruntjs.com/).

    git clone git@github.com:petkaantonov/bluebird.git
    cd bluebird
    npm install

##Testing

To run all tests, run `grunt test`. Note that new process is created for each test file, which means 40 processes as of now. The stdout of tests is ignored by default and everything will stop at the first failure.

Individual files can be run with `grunt test --run=filename` where `filename` is a test file name in `/test` folder or `/test/mocha` folder. The `.js` prefix is not needed. The dots for AP compliance tests are not needed, so to run `/test/mocha/2.3.3.js` for instance:

    grunt test --run=233

When trying to get a test to pass, run only that individual test file with `--verbose` to see the output from that test:

    grunt test --run=233 --verbose
    
The reason for the unusual way of testing is because the majority of tests are from different libraries using different testing frameworks and because it takes forever to test sequentially.
    
##Benchmarks

Currently the most relevant benchmark is @gorkikosev's benchmark in the article [Analysis of generators and other async patterns in node](http://spion.github.io/posts/analysis-generators-and-other-async-patterns-node.html). The benchmark emulates a situation where n amount of users are making a request in parallel to execute some mixed async/sync action. The benchmark has been modified to include a warm-up phase to minimize any JITing during timed sections.

You can run the benchmark with:

    bench spion
    
While on the project root. Requires bash (on windows the mingw32 that comes with git works fine too).

Node 0.11.2+ is required to run the generator examples.

Another benchmark to run is the [When.js benchmarks by CujoJS](https://github.com/cujojs/promise-perf-tests). The reduce and map have been modified from the original. The benchmarks also include warmup-phases.

    bench cujojs

While on the project root. Requires bash (on windows the mingw32 that comes with git works fine too).
    
##What is the sync build?

The sync build is provided to see how forced asynchronity affects benchmarks. It should not be used in real code due to the implied hazards.

The normal async build gives Promises/A+ guarantees about asynchronous resolution of promises. Some people think this affects performance or just plain love their code having a possibility
of stack overflow errors and non-deterministic behavior.

The sync build skips the async call trampoline completely, e.g code like:

    async.invoke( this.fn, this, val );
    
Appears as this in the sync build:

    this.fn(val);
    
This should pressure the CPU slightly less and thus the sync build should perform better. Indeed it does, but only marginally. The biggest performance boosts are from writing efficient Javascript, not from compromising deternism.

Note that while some benchmarks are waiting for the next event tick, the CPU is actually not in use during that time. So the resulting benchmark result is not completely accurate because on node.js you only care about how much the CPU is taxed. Any time spent on CPU is time the whole process (or server) is paralyzed. And it is not graceful like it would be with threads.


```js
var cache = new Map(); //ES6 Map or DataStructures/Map or whatever...
function getResult(url) {
    var resolver = Promise.pending();
    if (cache.has(url)) {
        resolver.fulfill(cache.get(url));
    }
    else {
        http.get(url, function(err, content) {
            if (err) resolver.reject(err);
            else {
                cache.set(url, content);
                resolver.fulfill(content);
            }
        });
    }
    return resolver.promise;
}



//The result of console.log is truly random without async guarantees
function guessWhatItPrints( url ) {
    var i = 3;
    getResult(url).then(function(){
        i = 4;
    });
    console.log(i);
}
```

#Optimization guide

todo

#License

Copyright (c) 2013 Petka Antonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:</p>

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.