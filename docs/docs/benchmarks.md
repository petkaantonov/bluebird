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
callbacks-baseline.js                           116       33.98
callbacks-suguru03-neo-async-waterfall.js       145       43.81
promises-bluebird-generator.js                  183       42.35
promises-bluebird.js                            214       43.41
promises-cujojs-when.js                         312       64.37
promises-then-promise.js                        396       74.33
promises-tildeio-rsvp.js                        414       84.80
promises-native-async-await.js                  422      104.23
promises-ecmascript6-native.js                  424       92.12
generators-tj-co.js                             444       90.98
promises-lvivski-davy.js                        480      114.46
callbacks-caolan-async-waterfall.js             520      109.01
promises-dfilatov-vow.js                        612      134.38
promises-obvious-kew.js                         725      208.63
promises-calvinmetcalf-lie.js                   730      164.96
streamline-generators.js                        809      154.36
promises-medikoo-deferred.js                    913      178.51
observables-pozadi-kefir.js                     991      194.00
streamline-callbacks.js                        1127      196.54
observables-Reactive-Extensions-RxJS.js        1906      268.41
observables-caolan-highland.js                 6887      662.08
promises-kriskowal-q.js                        8533      435.51
observables-baconjs-bacon.js.js               21282      882.61

Platform info:
Linux 4.4.0-79-generic x64
Node.JS 8.6.0
V8 6.0.287.53
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
callbacks-baseline.js                          274       75.11
callbacks-suguru03-neo-async-parallel.js       320       88.84
promises-bluebird.js                           407      107.25
promises-bluebird-generator.js                 432      113.19
callbacks-caolan-async-parallel.js             550      154.27
promises-cujojs-when.js                        648      168.65
promises-ecmascript6-native.js                1145      308.87
promises-lvivski-davy.js                      1153      257.36
promises-native-async-await.js                1260      323.68
promises-then-promise.js                      1372      313.24
promises-tildeio-rsvp.js                      1435      398.73
promises-medikoo-deferred.js                  1626      306.02
promises-calvinmetcalf-lie.js                 1805      351.21
promises-dfilatov-vow.js                      2492      558.25
promises-obvious-kew.js                       3403      784.61
streamline-generators.js                     13068      919.24
streamline-callbacks.js                      25509     1141.57

Platform info:
Linux 4.4.0-79-generic x64
Node.JS 8.6.0
V8 6.0.287.53
Intel(R) Core(TM) i5-6600K CPU @ 3.50GHz × 4
```

###3\. Latency benchmarks

For reasonably fast promise implementations latency is going to be fully determined by the scheduler being used and is therefore not interesting to benchmark. [JSPerfs](https://jsperf.com/) that benchmark promises tend to benchmark latency.
