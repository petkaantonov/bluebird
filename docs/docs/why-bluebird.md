---
id: why-bluebird
title: Why bluebird?
---

There are many third party promise libraries available for JavaScript and even the standard library contains a promise implementation in newer versions of browsers and node/io.js. This page will explore why one might use bluebird promises over other third party or the standard library implementations. For reasons why to use promises in general, see the [Why Promises?](why-promises.html) article.

###Bluebird design principles

Bluebird is built with the following design principles in mind:

 - **Pragmatic and not theoretical.** - Bluebird will always pick the pragmatic route vs the theoretically elegant one when there is a conflict. The library's API was created based on real-life use cases and after a lot of consideration.
 - **Fully featured without bloat** - Bluebird provides all the tools and utilities needed to realize a highly expressive and fluent DSL for asynchronous JavaScript without suffering from bloat by avoiding incorporating features that are solely motivated by theoretical arguments, have extremely narrow applicability or have limited synergy and composability with existing features.
 - **Easy to debug** - A major consequence of choosing pragmatism over theoretical elegancy, a property that among promise libraries taken to this extent is unique to bluebird.
    - Bluebird ships with the best cross-platform long stack traces out there and a warning system. This helps you recognize common and devastating promise usage mistakes early before they lead to hard to debug code later.
    - Unhandled errors are not silently swallowed by default but reported along with helpful stack traces where applicable. All of this is of course configurable.
 - **Zero overhead abstraction** - In server-side applications the performance of a promise implementation matters. Bluebird's server side performance is measured with highly relevant realistic end-to-end macro [benchmarks](benchmarks.html) and consistently comes out on top. We understand that if bluebird is as close to a zero cost abstraction as possible, developers won't be tempted to short-circuit and absorb complexity themselves.
 - **Runs everywhere** - Bluebird runs on pretty much every platform. This makes bluebird ideal for projects who care about providing consistent cross-platform and cross-version experience. It runs on old IE, it has even been known to run on Netscape 7.
 - **Spec compatible** - bluebird can work as a drop-in replacement for native promises for an instant performance boost. It passes the Promises/A+ test suite and is fully spec compliant.



