---
id: benchmarks
title: Benchmarks
---

Benchmarks have been ran with the following versions of modules.

```
├── async@0.9.0
├── davy@0.3.3
├── deferred@0.7.1
├── kew@0.5.0-alpha.1
├── lie@2.8.0
├── optimist@0.6.1
├── promise@6.0.1
├── q@1.1.2
├── rsvp@3.0.16
├── vow@0.4.7
└── when@3.6.4
├── rx@2.3.25
├── co@4.2.0
├── baconjs@0.7.43
├── highland@2.3.0
```

###1\. DoxBee sequential

This is Gorki Kosev's benchmark used in the article [Analysis of generators and other async patterns in node](http://spion.github.io/posts/analysis-generators-and-other-async-patterns-node.html). The benchmark emulates a situation where N=10000 requests are being made concurrently to execute some mixed async/sync action with fast I/O response times.

This is a throughput benchmark.

Every implementation runs in a freshly created isolated process which is warmed up to the benchmark code before timing it. The memory column represents the highest snapshotted RSS memory (as reported by `process.memoryUsage().rss`) during processing.

Command: `./bench doxbee` (<a href="{{ "/docs/contribute.html#benchmarking" | prepend: site.baseurl }}">needs cloned repository</a>)

The implementations for this benchmark are found in [`benchmark/doxbee-sequential`](https://github.com/petkaantonov/bluebird/tree/master/benchmark/doxbee-sequential) directory.


```
results for 10000 parallel executions, 1 ms per I/O op

file                                       time(ms)  memory(MB)
callbacks-baseline.js                           663       44.55
promises-bluebird-generator.js                  813       37.60
callbacks-suguru03-neo-async-waterfall.js       888       52.06
promises-bluebird.js                            968       44.70
streamline-callbacks.js                         975       46.09
promises-cujojs-when.js                        1186       67.83
promises-tildeio-rsvp.js                       1206       66.36
callbacks-caolan-async-waterfall.js            1362       74.04
promises-lvivski-davy.js                       1661      116.60
promises-dfilatov-vow.js                       1752      112.46
promises-calvinmetcalf-lie.js                  1785      148.23
promises-ecmascript6-native.js                 2342      185.77
generators-tj-co.js                            2395      139.55
streamline-generators.js                       2418       73.86
promises-obvious-kew.js                        3227      260.14
promises-then-promise.js                       3861      198.64
promises-medikoo-deferred.js                   5679      193.71
observables-Reactive-Extensions-RxJS.js        7101      296.21
observables-caolan-highland.js                23080      506.65
observables-baconjs-bacon.js.js               32433      840.13
promises-kriskowal-q.js                       35247      874.35
observables-pozadi-kefir.js                     OOM         OOM

Platform info:
Linux 3.13.0-45-generic x64
Node.JS 4.2.1
V8 4.5.103.35
Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
```

###2\. Parallel

This made-up scenario runs 25 shimmed queries in parallel per each request (N=10000) with fast I/O response times.

This is a throughput benchmark.

Every implementation runs in a freshly created isolated process which is warmed up to the benchmark code before timing it. The memory column represents the highest snapshotted RSS memory (as reported by `process.memoryUsage().rss`) during processing.

Command: `./bench parallel` (<a href="{{ "/docs/contribute.html#benchmarking" | prepend: site.baseurl }}">needs cloned repository</a>)

The implementations for this benchmark are found in [`benchmark/madeup-parallel`](https://github.com/petkaantonov/bluebird/tree/master/benchmark/madeup-parallel) directory.

```
results for 10000 parallel executions, 1 ms per I/O op

file                                      time(ms)  memory(MB)
callbacks-baseline.js                         1156       49.62
promises-bluebird.js                          1734       72.48
promises-bluebird-generator.js                1781       76.48
callbacks-suguru03-neo-async-parallel.js      1923       98.93
promises-tildeio-rsvp.js                      2094      182.40
promises-cujojs-when.js                       2213      141.85
promises-dfilatov-vow.js                      2636      167.55
callbacks-caolan-async-parallel.js            3597      184.08
promises-lvivski-davy.js                      3903      239.07
promises-calvinmetcalf-lie.js                 4082      358.31
promises-ecmascript6-native.js                4816      486.15
streamline-callbacks.js                       5413      315.71
promises-then-promise.js                      6132      640.13
promises-medikoo-deferred.js                 14128      576.38
promises-obvious-kew.js                      15782     1095.91
streamline-generators.js                     24743      840.59

Platform info:
Linux 3.13.0-45-generic x64
Node.JS 4.2.1
V8 4.5.103.35
Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
```

###3\. Latency benchmarks

For reasonably fast promise implementations latency is going to be fully determined by the scheduler being used and is therefore not interesting to benchmark. [JSPerfs](https://jsperf.com/) that benchmark promises tend to benchmark latency.
