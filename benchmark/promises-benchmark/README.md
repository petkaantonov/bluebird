Promises Benchmarks
===================

This project provides benchmarks for real-world scenarios of asynchronous
concurrency and the alternatives to encode these scenarios in JavaScript
(Node.js).


## Running

    $ git clone git://github.com/killdream/promises-benchmark
    $ cd promises-benchmark
    $ npm install
    $ make benchmark
    
You can run `make benchmark-harmony` to run tests with semi-coroutines by way
of Harmony generators. Just note that this will only work on Node v0.11.2. You
can use [n](http://github.com/visionmedia/n) to make that easier for you ;3
    

## Scenarios

1) Processing tweets to discover trends and topic relationships.

The application searches the latest 100 tweets for a topic (hashtag), and
scrapes all topics that are related to the initial one, as well as noting which
users are talking about which topic. In the end, the program presents a summary
that shows the trends and relationships between those topics and
people. Everything is done in real-time, without caching.


2) Hot-compilation of development assets.

A web server provides end-points to compile development resources (in this
case, Browserify bundles) on-the-go, and caches the results such that people
don't need to wait a full minute for each reload. All responses are
asynchronously sent over HTTP.


3) Processing lists of mixed timed values.

Data-processing functions work on a List that might contain either asynchronous
values or synchronous values. The synchronous values might be the result of a
memoised function for performance reasons.


## Licence

MIT. Do whatever you want.
