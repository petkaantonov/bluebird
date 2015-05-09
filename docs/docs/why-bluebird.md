---
id: why-bluebird
title: Why bluebird?
---

There are many promise libraries available in NPM and promises are native in newer versions of browsers and node/io.js. This page will discuss why bluebird

###Bluebird design principles

Bluebird is built with several design principles in mind. In this section we'll explain them

 - **Pragmatic and not theoretical.** - bluebird will always pick the pragmatic route vs the theoretically elegant one. The library's API was created based on real-life use cases and after a lot of consideration. Bluebird consistently picks APIs that cater for 99.9% of developers rather than catering theoretical edge cases.
 - **Easy to debug** - Bluebird ships with the best cross-platform long stack traces out there. We also ship with warnings to help you spot out errors easily, and we have unhandled rejection detection so no error ever goes silenced - a concept bluebird pioneered and later got integrated into io.js at a lighter weaker version.
 - **Zero overhead abstraction** - Bluebird cares about performance. We provide tools for zero-overhead wrapping of APIs and consistently win the [benchmarks](/benchmarks.html). We understand that if bluebird is as close to a zero cost abstraction as possible, developers won't be tempted to short-circuit and absorb complexity themselves.
 - **Runs everywhere** - Bluebird runs on pretty much every platform. This makes bluebird ideal for projects who care about providing consistent cross-platform and cross-version experience. It runs on old IE, I even ran it once on Netscape 7 and it ran just fine.
 - **Spec compatible** - bluebird can work as a drop-in replacement for native promises for an instant performance boost. It passes the Promises/A+ test suite and is fully spec complaint.

###Performance comparison

Bluebird is typically much faster than native promises. In particular this is the case in V8 (Chrome and Node/io.js).

This is for two reasons. First of all, bluebird was written with performance in mind so it was optimized for from day one. Second, since bluebird is implemented in userland it can be aware of API structures native promises cannot be (for example, automatic promisifcation).

You can see [The benchmarks section](/benchmarks.html) yourself on just how fast Bluebird is compared to other approaches on a server-side benchmark.

###Debugging

Bluebird ships with long stack traces that make debugging promises considerably easier. It makes spotting and understanding remote errors a much easier job.

Unhandled rejection detection means your errors never get suppressed by the application - a common problem in other libraries.
