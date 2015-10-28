---
id: benchmarks
title: Benchmarks
---

Benchmarks have been ran with the following versions of modules.

```
├── async@1.5.0
├── babel@5.8.29
├── davy@1.0.1
├── deferred@0.7.3
├── kew@0.7.0
├── lie@3.0.1
├── neo-async@1.6.0
├── optimist@0.6.1
├── promise@7.0.4
├── q@1.4.1
├── rsvp@3.1.0
├── streamline@1.0.7
├── text-table@0.2.0
├── vow@0.4.11
└── when@3.7.4
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
callbacks-baseline.js                           160       44.53
callbacks-suguru03-neo-async-waterfall.js       227       47.89
promises-bluebird-generator.js                  247       37.76
streamline-callbacks.js                         302       45.64
promises-bluebird.js                            322       31.92
promises-cujojs-when.js                         357       60.88
promises-tildeio-rsvp.js                        419       64.88
promises-lvivski-davy.js                        543      109.81
callbacks-caolan-async-waterfall.js             557      102.08
promises-then-promise.js                        609      124.34
promises-dfilatov-vow.js                        632      138.27
streamline-generators.js                        647       73.85
promises-calvinmetcalf-lie.js                   661      130.81
generators-tj-co.js                             789      137.84
promises-ecmascript6-native.js                  847      182.71
promises-obvious-kew.js                        1240      254.99
promises-medikoo-deferred.js                   2053      201.29
observables-Reactive-Extensions-RxJS.js        2430      279.24
observables-pozadi-kefir.js                    2559      159.62
observables-baconjs-bacon.js.js               18482      883.22
promises-kriskowal-q.js                       23081      876.11
observables-caolan-highland.js                28138      517.57

Platform info:
Linux 3.13.0-32-generic x64
Node.JS 4.2.1
V8 4.5.103.35
Intel(R) Core(TM) i7-4900MQ CPU @ 2.80GHz × 8
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
callbacks-baseline.js                          290       49.25
promises-bluebird.js                           382       72.45
promises-bluebird-generator.js                 407       76.25
callbacks-suguru03-neo-async-parallel.js       472       97.05
promises-tildeio-rsvp.js                       597      182.07
promises-cujojs-when.js                        610      142.19
callbacks-caolan-async-parallel.js             804      157.11
promises-lvivski-davy.js                      1229      262.84
promises-calvinmetcalf-lie.js                 1301      338.68
promises-then-promise.js                      1585      367.77
streamline-callbacks.js                       1800      315.59
promises-ecmascript6-native.js                1816      481.08
promises-dfilatov-vow.js                      1980      489.30
promises-medikoo-deferred.js                  4181      522.04
promises-obvious-kew.js                       5473     1075.70
streamline-generators.js                      7980      840.97

Platform info:
Linux 3.13.0-32-generic x64
Node.JS 4.2.1
V8 4.5.103.35
Intel(R) Core(TM) i7-4900MQ CPU @ 2.80GHz × 8
```

###3\. Latency benchmarks

For reasonably fast promise implementations latency is going to be fully determined by the scheduler being used and is therefore not interesting to benchmark. [JSPerfs](https://jsperf.com/) that benchmark promises tend to benchmark latency.
