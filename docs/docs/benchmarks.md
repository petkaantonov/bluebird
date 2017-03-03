---
id: benchmarks
title: Benchmarks
---

Benchmarks have been ran with the following versions of modules.

```
├── async@1.5.2
├── babel@5.8.35
├── davy@1.1.0
├── deferred@0.7.5
├── kew@0.7.0
├── lie@3.0.2
├── neo-async@1.7.3
├── optimist@0.6.1
├── promise@7.1.1
├── q@1.4.1
├── rsvp@3.2.1
├── streamline@2.0.16
├── streamline-runtime@1.0.38
├── text-table@0.2.0
├── vow@0.4.12
└── when@3.7.7
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
callbacks-baseline.js                            87       24.27
callbacks-suguru03-neo-async-waterfall.js       116       35.96
promises-bluebird-generator.js                  180       38.39
promises-bluebird.js                            209       52.41
promises-cujojs-when.js                         287       70.73
promises-then-promise.js                        293       78.07
promises-tildeio-rsvp.js                        366       91.94
callbacks-caolan-async-waterfall.js             428      103.80
promises-dfilatov-vow.js                        491      135.49
promises-lvivski-davy.js                        503      128.99
generators-tj-co.js                             565      113.61
promises-calvinmetcalf-lie.js                   567      159.27
promises-ecmascript6-native.js                  658      157.39
promises-obvious-kew.js                         676      213.68
promises-medikoo-deferred.js                    850      183.01
observables-pozadi-kefir.js                     975      188.22
observables-Reactive-Extensions-RxJS.js        1208      265.21
streamline-generators.js                       2216      126.47
observables-caolan-highland.js                 4844      537.79
promises-kriskowal-q.js                        4950      380.89
observables-baconjs-bacon.js.js               14924      802.07
streamline-callbacks.js                       38855      197.81

Platform info:
Linux 4.4.0-64-generic x64
Node.JS 7.7.1
V8 5.5.372.41
Intel(R) Core(TM) i5-6600K CPU @ 3.50GHz × 4

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
callbacks-baseline.js                          200       71.39
callbacks-suguru03-neo-async-parallel.js       289       89.80
promises-bluebird.js                           390      102.95
promises-bluebird-generator.js                 422      110.15
callbacks-caolan-async-parallel.js             502      151.99
promises-cujojs-when.js                        615      166.69
promises-lvivski-davy.js                       863      282.39
promises-then-promise.js                       942      309.98
promises-calvinmetcalf-lie.js                 1272      367.50
promises-tildeio-rsvp.js                      1473      397.67
promises-ecmascript6-native.js                1575      395.60
promises-medikoo-deferred.js                  1839      358.26
promises-dfilatov-vow.js                      2101      551.81
promises-obvious-kew.js                       3562      728.36
streamline-generators.js                     14661     1097.45
streamline-callbacks.js                      28902     1204.92

Platform info:
Linux 4.4.0-64-generic x64
Node.JS 7.7.1
V8 5.5.372.41
Intel(R) Core(TM) i5-6600K CPU @ 3.50GHz × 4
```

###3\. Latency benchmarks

For reasonably fast promise implementations latency is going to be fully determined by the scheduler being used and is therefore not interesting to benchmark. [JSPerfs](https://jsperf.com/) that benchmark promises tend to benchmark latency.
